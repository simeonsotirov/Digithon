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
    "espresso pod": "espresso pods",
    "espresso pods": "espresso pods",
    "oat milk": "oat milk",
    "oatmilk": "oat milk",
    "tea": "tea bags",
    "tea bags": "tea bags",
}

REORDER_POINTS = {
    "coffee beans": 10,
    "espresso pods": 12,
    "oat milk": 8,
    "tea bags": 15,
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


def reorder_signal(product_name: str, quantity: int) -> str:
    point = REORDER_POINTS.get(product_name, 5)
    if quantity == 0:
        return "stockout"
    if quantity <= point // 2:
        return "reorder"
    if quantity <= point:
        return "watch"
    return "ok"


def normalize_row(row: dict[str, Any], source_row_number: int) -> NormalizedRecord:
    notes: list[str] = []
    store_value = row.get("store") or row.get("store_name") or row.get("location")
    product_value = row.get("product") or row.get("product_name") or row.get("sku")
    quantity_value = row.get("quantity") or row.get("qty") or row.get("units")
    price_value = row.get("price") or row.get("unit_price") or row.get("amount")
    date_value = row.get("sale_date") or row.get("date") or row.get("sold_at")

    store = canonical_store(_clean(store_value), notes)
    product = canonical_product(_clean(product_value), notes)
    quantity = parse_quantity(_clean(quantity_value), notes)
    price = parse_price(_clean(price_value), notes)
    sale_date = parse_sale_date(_clean(date_value), notes)

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
        },
        quality_notes=sorted(set(notes)),
        reorder_signal=reorder_signal(product, quantity),
    )


def normalize_csv(path: Path) -> list[NormalizedRecord]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return [normalize_row(row, index) for index, row in enumerate(reader, start=1)]


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
