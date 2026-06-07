from pathlib import Path


CSV = """store,product,quantity,price,sale_date
Downtown Store,Coffee-Beans,18,$12.99,2026-06-01
DT,coffee bean,4,"13,49",06/02/2026
North Side,oatmilk,0,$4.20,2026/06/03
south shop,Tea,7,USD 6.50,Jun 04 2026
DTWN,espresso pod,5,$9.99,04/06/2026
North,coffee beans,-2,bad-price,not-a-date
"""


def main() -> None:
    path = Path("db/seed/messy_sales.csv")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(CSV, encoding="utf-8")
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
