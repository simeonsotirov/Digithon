from __future__ import annotations

import argparse
import csv
from dataclasses import asdict, dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
import hashlib
import json
import re
from pathlib import Path
from typing import Any


STORE_ALIASES = {
    "downtown": "downtown",
    "downtown store": "downtown",
    "dt": "downtown",
    "dtwn": "downtown",
    "north": "north",
    "north side": "north",
    "northside": "north",
    "south": "south",
    "south shop": "south",
}

PRODUCT_ALIASES = {
    "coffee bean": "coffee beans",
    "coffee beans": "coffee beans",
    "coffee-beans": "coffee beans",
    "coffee_beans": "coffee beans",
    "espresso pod": "espresso pods",
    "espresso pods": "espresso pods",
    "esp pods": "espresso pods",
    "espresso-pods": "espresso pods",
    "oat milk": "oat milk",
    "oatmilk": "oat milk",
    "oatmilk 1l": "oat milk",
    "tea": "tea bags",
    "tea bag": "tea bags",
    "tea bags": "tea bags",
    "tea-bags": "tea bags",
    "water bottle": "bottled water",
    "bottled water": "bottled water",
    "water 500ml": "bottled water",
    "h2o bottle": "bottled water",
    "cocacola500": "coca-cola 500ml",
    "coke .5l": "coca-cola 500ml",
    "coke bottle": "coca-cola 500ml",
    "coca cola 500ml": "coca-cola 500ml",
    "pepsi500": "pepsi 500ml",
    "pepsi bottle": "pepsi 500ml",
    "pepsi .5l": "pepsi 500ml",
    "pepsi 500 ml": "pepsi 500ml",
    "sparkling-water": "sparkling water",
    "spark water": "sparkling water",
    "seltzer": "sparkling water",
    "sparkling h2o": "sparkling water",
    "energydrink": "energy drink",
    "energy-drink": "energy drink",
    "energy can": "energy drink",
    "energy": "energy drink",
    "chips": "potato chips",
    "potato chip": "potato chips",
    "potato-chip": "potato chips",
    "potato chips": "potato chips",
    "crisps": "potato chips",
    "tortilla chip": "tortilla chips",
    "tortilla-chip": "tortilla chips",
    "tortilla chips": "tortilla chips",
    "nacho chips": "tortilla chips",
    "tort chips": "tortilla chips",
    "pretzel": "pretzels",
    "pretzels": "pretzels",
    "pretzel bag": "pretzels",
    "pop corn": "popcorn",
    "popcorn bag": "popcorn",
    "pop-corn": "popcorn",
    "popcorn": "popcorn",
    "frozenpizza": "frozen pizza",
    "frozen-pizza": "frozen pizza",
    "pizza frozen": "frozen pizza",
    "freezer pizza": "frozen pizza",
    "frozen fries": "frozen fries",
    "frozen-fries": "frozen fries",
    "fries frozen": "frozen fries",
    "freezer fries": "frozen fries",
    "bread": "bread",
    "white bread": "bread",
    "bread loaf": "bread",
    "milk": "milk",
    "whole milk": "milk",
    "milk 1l": "milk",
    "eggs": "eggs",
    "egg dozen": "eggs",
    "12 eggs": "eggs",
    "cereal": "cereal",
    "cereal box": "cereal",
    "breakfast cereal": "cereal",
    "granola": "granola bars",
    "granola-bars": "granola bars",
    "granola bars": "granola bars",
    "snack bars": "granola bars",
    "sandwich": "sandwich packs",
    "sandwich pack": "sandwich packs",
    "sandwich packs": "sandwich packs",
    "lunch sandwich": "sandwich packs",
    "chocolate": "chocolate bars",
    "choc bars": "chocolate bars",
    "chocolate bars": "chocolate bars",
    "candy bar": "chocolate bars",
    "candy": "candy packs",
    "candy pack": "candy packs",
    "candy-pack": "candy packs",
    "candy packs": "candy packs",
    "sweet packs": "candy packs",
    "giftcard": "gift cards",
    "gift card": "gift cards",
    "gift-card": "gift cards",
    "gift cards": "gift cards",
    "store gift card": "gift cards",
    "seasonal mugs": "seasonal mugs",
    "seasonal mug": "seasonal mugs",
    "holiday mug": "seasonal mugs",
    "seasonal-mugs": "seasonal mugs",
    "mugs seasonal": "seasonal mugs",
    "paper cup": "paper cups",
    "paper cups": "paper cups",
    "paper-cups": "paper cups",
    "cups paper": "paper cups",
    "checkout cups": "paper cups",
    "checkout bag": "checkout bags",
    "checkout bags": "checkout bags",
    "checkout-bags": "checkout bags",
    "paper bags": "checkout bags",
    "bags checkout": "checkout bags",
    "note books": "notebooks",
    "notebook": "notebooks",
    "notebooks": "notebooks",
    "note-books": "notebooks",
    "school notebook": "notebooks",
    "pencil": "pencils",
    "pencils": "pencils",
    "school pencils": "pencils",
    "lunch box": "lunch boxes",
    "lunch-box": "lunch boxes",
    "lunch boxes": "lunch boxes",
    "school lunchbox": "lunch boxes",
}

REORDER_POINTS = {
    "coffee beans": 10,
    "espresso pods": 12,
    "oat milk": 8,
    "tea bags": 15,
    "bottled water": 30,
    "coca-cola 500ml": 28,
    "pepsi 500ml": 24,
    "sparkling water": 16,
    "energy drink": 18,
    "potato chips": 22,
    "tortilla chips": 20,
    "pretzels": 14,
    "popcorn": 16,
    "frozen pizza": 10,
    "frozen fries": 10,
    "bread": 12,
    "milk": 14,
    "eggs": 12,
    "cereal": 10,
    "granola bars": 12,
    "sandwich packs": 10,
    "chocolate bars": 18,
    "candy packs": 16,
    "gift cards": 8,
    "seasonal mugs": 8,
    "paper cups": 12,
    "checkout bags": 50,
    "notebooks": 14,
    "pencils": 18,
    "lunch boxes": 8,
}


@dataclass
class NormalizedRecord:
    source_row_number: int
    source_row_hash: str
    canonical_store: str
    product_name: str
    quantity: int
    price: float
    sale_date: str
    normalized_payload: dict[str, Any]
    quality_notes: list[str]
    reorder_signal: str


def _clean(value: Any) -> str:
    return str(value or "").strip()


def stable_row_hash(row: dict[str, Any]) -> str:
    normalized = json.dumps(row, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def canonical_store(value: str, notes: list[str]) -> str:
    raw = _clean(value)
    key = re.sub(r"\s+", " ", raw.lower().replace("_", " ").replace("-", " "))
    canonical = STORE_ALIASES.get(key, key or "unknown")
    if canonical != raw.lower():
        notes.append("normalized_store_name")
    return canonical


def canonical_product(value: str, notes: list[str]) -> str:
    raw = _clean(value)
    key = re.sub(r"\s+", " ", raw.lower().replace("_", " ").replace("-", " "))
    canonical = PRODUCT_ALIASES.get(key, key or "unknown product")
    if canonical != raw.lower():
        notes.append("normalized_product_name")
    return canonical


def parse_quantity(value: str, notes: list[str]) -> int:
    raw = _clean(value).lower()
    match = re.search(r"-?\d+", raw)
    if not match:
        notes.append("defaulted_missing_quantity")
        return 0
    quantity = int(match.group(0))
    if quantity < 0:
        notes.append("clamped_negative_quantity")
        return 0
    if raw != str(quantity):
        notes.append("parsed_quantity_text")
    return quantity


def parse_price(value: str, notes: list[str]) -> float:
    raw = _clean(value)
    cleaned = raw.replace("$", "").replace("USD", "").strip()
    if "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")
        notes.append("parsed_price_comma_decimal")
    else:
        cleaned = cleaned.replace(",", "")
    try:
        price = Decimal(cleaned)
    except InvalidOperation:
        notes.append("defaulted_invalid_price")
        return 0.0
    if raw != str(price):
        notes.append("parsed_price_symbol")
    return float(price.quantize(Decimal("0.01")))


def parse_sale_date(value: str, notes: list[str]) -> str:
    raw = _clean(value)
    formats = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%b %d %Y", "%d-%b-%Y"]
    for fmt in formats:
        try:
            parsed = datetime.strptime(raw, fmt).date()
            if fmt != "%Y-%m-%d":
                notes.append("parsed_date_format")
            return parsed.isoformat()
        except ValueError:
            continue
    notes.append("defaulted_invalid_date")
    return "1970-01-01"


def normalize_category(value: str, product_name: str, notes: list[str]) -> str:
    raw = _clean(value)
    category = re.sub(r"\s+", " ", raw.lower().replace("_", " ").replace("-", " "))
    if not category:
        category = "uncategorized"
        notes.append("defaulted_missing_category")
    if category != raw.lower():
        notes.append("normalized_category")
    if product_name in {"coca-cola 500ml", "pepsi 500ml"}:
        return "soda"
    if product_name in {"potato chips", "tortilla chips"}:
        return "chips"
    return category


def inventory_risk(
    available_stock: int,
    missing_stock: int,
    damaged_stock: int,
    expired_stock: int,
    expiry_date: str,
    sale_date: str,
) -> str:
    if available_stock <= 0:
        return "stockout"
    if expired_stock > 0 or expiry_date <= sale_date:
        return "expiry_risk"
    if missing_stock > 0 or damaged_stock > 0:
        return "shrinkage"
    if available_stock <= 5:
        return "low_stock"
    return "ok"


def reorder_signal(product_name: str, quantity: int, available_stock: int | None = None) -> str:
    point = REORDER_POINTS.get(product_name, 5)
    stock = quantity if available_stock is None else available_stock
    if stock == 0:
        return "stockout"
    if stock <= point // 2:
        return "reorder"
    if stock <= point:
        return "watch"
    return "ok"


def normalize_row(row: dict[str, Any], source_row_number: int) -> NormalizedRecord:
    notes: list[str] = []
    store_value = row.get("store") or row.get("store_name") or row.get("location")
    product_value = row.get("product") or row.get("product_name") or row.get("sku")
    quantity_value = row.get("quantity_sold") or row.get("quantity") or row.get("qty") or row.get("units")
    current_stock_value = row.get("current_stock") or row.get("stock") or row.get("on_hand")
    missing_stock_value = row.get("missing_stock") or row.get("missing")
    damaged_stock_value = row.get("damaged_stock") or row.get("damaged")
    expired_stock_value = row.get("expired_stock") or row.get("expired")
    price_value = row.get("price") or row.get("unit_price") or row.get("amount")
    date_value = row.get("sale_date") or row.get("date") or row.get("sold_at")
    expiry_date_value = row.get("expiry_date") or row.get("expires_at") or row.get("best_before")
    supplier = _clean(row.get("supplier")) or "unknown supplier"
    event_hint = _clean(row.get("event_hint"))

    store = canonical_store(_clean(store_value), notes)
    product = canonical_product(_clean(product_value), notes)
    quantity = parse_quantity(_clean(quantity_value), notes)
    current_stock = parse_quantity(_clean(current_stock_value), notes)
    missing_stock = parse_quantity(_clean(missing_stock_value), notes)
    damaged_stock = parse_quantity(_clean(damaged_stock_value), notes)
    expired_stock = parse_quantity(_clean(expired_stock_value), notes)
    price = parse_price(_clean(price_value), notes)
    sale_date = parse_sale_date(_clean(date_value), notes)
    expiry_date = parse_sale_date(_clean(expiry_date_value), notes) if _clean(expiry_date_value) else "1970-01-01"
    category = normalize_category(_clean(row.get("category")), product, notes)
    available_stock = max(0, current_stock - missing_stock - damaged_stock - expired_stock)
    risk = inventory_risk(
        available_stock,
        missing_stock,
        damaged_stock,
        expired_stock,
        expiry_date,
        sale_date,
    )

    return NormalizedRecord(
        source_row_number=source_row_number,
        source_row_hash=stable_row_hash(row),
        canonical_store=store,
        product_name=product,
        quantity=quantity,
        price=price,
        sale_date=sale_date,
        normalized_payload={
            "raw": row,
            "original_store": _clean(store_value),
            "canonical_store": store,
            "original_product": _clean(product_value),
            "quantity_sold": quantity,
            "current_stock": current_stock,
            "missing_stock": missing_stock,
            "damaged_stock": damaged_stock,
            "expired_stock": expired_stock,
            "available_stock": available_stock,
            "inventory_risk": risk,
            "expiry_date": expiry_date,
            "supplier": supplier,
            "category": category,
            "event_hint": event_hint,
        },
        quality_notes=sorted(set(notes)),
        reorder_signal=reorder_signal(product, quantity, available_stock),
    )


def normalize_csv(path: Path) -> list[NormalizedRecord]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        records: list[NormalizedRecord] = []
        seen_hashes: set[str] = set()
        for index, row in enumerate(reader, start=1):
            record = normalize_row(row, index)
            if record.source_row_hash in seen_hashes:
                continue
            seen_hashes.add(record.source_row_hash)
            records.append(record)
        return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize messy retail CSV data")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    records = [asdict(record) for record in normalize_csv(args.input)]
    payload = json.dumps(records, indent=2)
    if args.output:
        args.output.write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)


if __name__ == "__main__":
    main()
