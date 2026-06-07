from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
import random


ROW_COUNT = 750
RANDOM_SEED = 20260607
START_DATE = date(2026, 3, 1)
END_DATE = date(2026, 10, 15)


@dataclass(frozen=True)
class Product:
    canonical: str
    aliases: tuple[str, ...]
    category: str
    tags: tuple[str, ...]
    base_price: float
    base_sold: int
    stock_target: int


@dataclass(frozen=True)
class EventWindow:
    name: str
    starts_on: date
    ends_on: date
    tags: tuple[str, ...]
    multiplier: float


STORES = {
    "downtown": ("Downtown Store", "DT", "DTWN", "downtown", "Downtown-01"),
    "north": ("North Side", "North", "northside", "NORTH_SIDE", "north shop"),
    "south": ("South Shop", "south", "S-Shop", "south shop", "Southside"),
    "west": ("West Market", "west", "W Market", "West-Market", "westside"),
    "east": ("East Corner", "east", "E Corner", "East-Corner", "eastside"),
    "airport": ("Airport Kiosk", "AIR", "Airport-Kiosk", "airport", "terminal shop"),
}

SUPPLIERS = (
    "Metro Wholesale",
    "FreshLine Supply",
    "QuickMart Distribution",
    "Urban Goods Co",
    "Northstar Foods",
)

PRODUCTS = (
    Product("coffee beans", ("Coffee-Beans", "coffee bean", "COFFEE beans", "coffee_beans"), "coffee", ("coffee beans", "beverages", "groceries"), 12.99, 9, 34),
    Product("espresso pods", ("espresso pod", "ESP pods", "espresso-pods", "Espresso Pods"), "coffee", ("espresso pods", "coffee beans", "beverages"), 9.99, 8, 30),
    Product("tea bags", ("Tea", "tea bag", "tea-bags", "TEA BAGS"), "tea", ("tea bags", "beverages", "groceries"), 6.50, 7, 28),
    Product("oat milk", ("oatmilk", "Oat-Milk", "oat milk", "OATMILK 1L"), "groceries", ("beverages", "groceries"), 4.20, 6, 22),
    Product("bottled water", ("water bottle", "Bottled Water", "water 500ml", "H2O bottle"), "beverages", ("beverages", "groceries"), 1.49, 20, 70),
    Product("coca-cola 500ml", ("CocaCola500", "Coke .5L", "coke bottle", "coca cola 500ml"), "soda", ("soda", "beverages"), 1.99, 18, 64),
    Product("pepsi 500ml", ("Pepsi500", "pepsi bottle", "PEPSI .5L", "pepsi 500 ml"), "soda", ("soda", "beverages"), 1.89, 15, 58),
    Product("sparkling water", ("sparkling-water", "Spark Water", "seltzer", "sparkling h2o"), "beverages", ("beverages"), 2.25, 10, 36),
    Product("energy drink", ("EnergyDrink", "energy-drink", "energy can", "ENERGY"), "beverages", ("beverages"), 3.49, 11, 38),
    Product("potato chips", ("chips", "potato-chip", "Potato Chips", "crisps"), "chips", ("chips", "snacks"), 2.99, 14, 52),
    Product("tortilla chips", ("tortilla-chip", "Tortilla Chips", "nacho chips", "tort chips"), "chips", ("chips", "snacks"), 3.29, 11, 44),
    Product("pretzels", ("pretzel", "Pretzels", "pretzel bag", "PRETZELS"), "snacks", ("snacks"), 2.79, 8, 32),
    Product("popcorn", ("Pop Corn", "popcorn bag", "POP-CORN", "popcorn"), "snacks", ("snacks"), 2.49, 9, 34),
    Product("frozen pizza", ("FrozenPizza", "frozen-pizza", "pizza frozen", "freezer pizza"), "frozen", ("frozen pizza", "groceries"), 7.99, 7, 24),
    Product("frozen fries", ("Frozen Fries", "frozen-fries", "fries frozen", "freezer fries"), "frozen", ("groceries"), 4.99, 6, 22),
    Product("bread", ("Bread", "white bread", "bread loaf", "BREAD"), "groceries", ("groceries"), 3.49, 9, 28),
    Product("milk", ("Milk", "whole milk", "milk 1L", "MILK"), "groceries", ("groceries", "beverages"), 3.99, 10, 30),
    Product("eggs", ("Eggs", "egg dozen", "12 eggs", "EGGS"), "groceries", ("groceries"), 4.50, 7, 24),
    Product("cereal", ("Cereal", "cereal box", "breakfast cereal", "CEREAL"), "groceries", ("groceries"), 5.49, 5, 20),
    Product("granola bars", ("granola", "granola-bars", "Granola Bars", "snack bars"), "lunch items", ("lunch items", "snacks"), 4.99, 8, 28),
    Product("sandwich packs", ("sandwich", "sandwich pack", "Sandwich Packs", "lunch sandwich"), "lunch items", ("lunch items", "groceries"), 6.99, 6, 20),
    Product("chocolate bars", ("chocolate", "choc bars", "Chocolate Bars", "candy bar"), "candy", ("candy", "snacks"), 1.79, 12, 42),
    Product("candy packs", ("Candy", "candy-pack", "Candy Packs", "sweet packs"), "candy", ("candy", "snacks"), 3.99, 10, 36),
    Product("gift cards", ("GiftCard", "gift-card", "Gift Cards", "store gift card"), "gifts", ("gifts"), 25.00, 3, 16),
    Product("seasonal mugs", ("Seasonal Mug", "holiday mug", "seasonal-mugs", "mugs seasonal"), "seasonal items", ("seasonal items", "gifts"), 8.99, 4, 18),
    Product("paper cups", ("Paper Cups", "paper-cups", "cups paper", "checkout cups"), "checkout supplies", ("checkout supplies"), 5.99, 6, 26),
    Product("checkout bags", ("Checkout Bags", "checkout-bags", "paper bags", "bags checkout"), "checkout supplies", ("checkout supplies"), 0.20, 28, 100),
    Product("notebooks", ("Notebook", "notebooks", "note-books", "school notebook"), "stationery", ("stationery"), 2.99, 7, 28),
    Product("pencils", ("Pencil", "pencils", "school pencils", "PENCILS"), "stationery", ("stationery"), 1.99, 9, 36),
    Product("lunch boxes", ("Lunch Box", "lunch-box", "lunch boxes", "school lunchbox"), "lunch items", ("lunch items", "stationery"), 9.99, 4, 18),
)

EVENT_WINDOWS = (
    EventWindow("March Madness", date(2026, 3, 17), date(2026, 4, 6), ("snacks", "chips", "soda", "frozen pizza", "beverages"), 1.60),
    EventWindow("Easter", date(2026, 4, 1), date(2026, 4, 5), ("groceries", "gifts", "candy", "coffee beans", "tea bags"), 1.35),
    EventWindow("Cinco de Mayo", date(2026, 5, 3), date(2026, 5, 5), ("snacks", "chips", "soda", "beverages", "groceries"), 1.35),
    EventWindow("Graduation season", date(2026, 5, 15), date(2026, 6, 15), ("gifts", "snacks", "beverages", "coffee beans", "seasonal items"), 1.25),
    EventWindow("National Donut Day", date(2026, 6, 5), date(2026, 6, 5), ("coffee beans", "espresso pods", "beverages", "snacks"), 1.35),
    EventWindow("Summer travel season", date(2026, 6, 1), date(2026, 8, 15), ("snacks", "beverages", "soda", "coffee beans", "groceries"), 1.20),
    EventWindow("Father's Day", date(2026, 6, 18), date(2026, 6, 21), ("gifts", "snacks", "beverages", "coffee beans"), 1.30),
    EventWindow("Independence Day", date(2026, 7, 1), date(2026, 7, 4), ("snacks", "chips", "soda", "beverages", "groceries"), 1.45),
    EventWindow("Prime Day", date(2026, 7, 14), date(2026, 7, 15), ("coffee beans", "espresso pods", "checkout supplies", "snacks", "beverages"), 1.30),
    EventWindow("Back-to-school season", date(2026, 8, 1), date(2026, 9, 15), ("snacks", "beverages", "lunch items", "stationery"), 1.35),
    EventWindow("Labor Day", date(2026, 9, 4), date(2026, 9, 7), ("snacks", "chips", "soda", "beverages", "groceries"), 1.35),
    EventWindow("NFL kickoff", date(2026, 9, 8), date(2026, 9, 10), ("snacks", "chips", "soda", "frozen pizza", "beverages"), 1.45),
    EventWindow("National Coffee Day", date(2026, 9, 29), date(2026, 9, 29), ("coffee beans", "espresso pods", "beverages"), 1.50),
)


def date_range(start: date, end: date) -> list[date]:
    days = (end - start).days
    return [start + timedelta(days=offset) for offset in range(days + 1)]


def active_event(product: Product, sale_date: date) -> EventWindow | None:
    matches = [
        event
        for event in EVENT_WINDOWS
        if event.starts_on <= sale_date <= event.ends_on and set(product.tags) & set(event.tags)
    ]
    return max(matches, key=lambda event: event.multiplier, default=None)


def messy_int(value: int, rng: random.Random, allow_bad: bool = True) -> str:
    if allow_bad and rng.random() < 0.015:
        return "missing"
    if allow_bad and rng.random() < 0.012:
        return str(-abs(value))
    if rng.random() < 0.08:
        return f"{value} units"
    return str(value)


def messy_price(value: float, rng: random.Random) -> str:
    if rng.random() < 0.012:
        return "bad-price"
    if rng.random() < 0.16:
        return f"USD {value:.2f}"
    if rng.random() < 0.16:
        return f"{value:.2f}".replace(".", ",")
    return f"${value:.2f}"


def messy_date(value: date, rng: random.Random) -> str:
    if rng.random() < 0.01:
        return "not-a-date"
    formats = ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%b %d %Y", "%d-%b-%Y")
    return value.strftime(rng.choice(formats))


def build_row(rng: random.Random, sale_date: date) -> dict[str, str]:
    product = rng.choice(PRODUCTS)
    store_key = rng.choice(tuple(STORES.keys()))
    event = active_event(product, sale_date)
    demand_multiplier = event.multiplier if event else rng.uniform(0.80, 1.12)
    weekend_multiplier = 1.12 if sale_date.weekday() >= 5 else 1.0
    quantity_sold = max(0, round(product.base_sold * demand_multiplier * weekend_multiplier + rng.randint(-3, 4)))

    severe_risk = rng.random() < 0.035
    current_stock = 0 if severe_risk and rng.random() < 0.35 else max(0, round(product.stock_target - quantity_sold + rng.randint(-10, 14)))
    missing_stock = rng.choice((0, 0, 0, 1, 2, 3, 5)) if rng.random() < 0.16 or severe_risk else 0
    damaged_stock = rng.choice((0, 0, 1, 2, 4)) if rng.random() < 0.10 or severe_risk else 0
    expired_stock = rng.choice((0, 0, 1, 2, 3)) if rng.random() < 0.10 or severe_risk else 0
    expiry_offset = rng.randint(-20, 240) if rng.random() < 0.08 else rng.randint(30, 300)
    price = product.base_price * rng.uniform(0.92, 1.12)

    return {
        "store": rng.choice(STORES[store_key]),
        "product": rng.choice(product.aliases),
        "quantity_sold": messy_int(quantity_sold, rng),
        "current_stock": messy_int(current_stock, rng),
        "missing_stock": messy_int(missing_stock, rng, allow_bad=False),
        "damaged_stock": messy_int(damaged_stock, rng, allow_bad=False),
        "expired_stock": messy_int(expired_stock, rng, allow_bad=False),
        "price": messy_price(price, rng),
        "sale_date": messy_date(sale_date, rng),
        "expiry_date": messy_date(sale_date + timedelta(days=expiry_offset), rng),
        "supplier": rng.choice(SUPPLIERS),
        "category": product.category if rng.random() > 0.06 else product.category.upper().replace(" ", "-"),
        "event_hint": event.name if event else "",
    }


def generate_rows() -> list[dict[str, str]]:
    rng = random.Random(RANDOM_SEED)
    all_dates = date_range(START_DATE, END_DATE)
    rows = [build_row(rng, rng.choice(all_dates)) for _ in range(ROW_COUNT)]

    duplicate_count = 25
    for _ in range(duplicate_count):
        rows.insert(rng.randrange(len(rows)), dict(rng.choice(rows)))
    return rows


def main() -> None:
    path = Path("db/seed/messy_sales.csv")
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = generate_rows()
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {path}")


if __name__ == "__main__":
    main()
