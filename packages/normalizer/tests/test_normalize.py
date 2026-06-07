from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from normalizer.normalize import normalize_csv, normalize_row, reorder_signal


class NormalizeTests(unittest.TestCase):
    def test_store_aliases_normalize_to_canonical_names(self) -> None:
        for raw_store in ["DT", "DTWN", "Downtown Store"]:
            with self.subTest(raw_store=raw_store):
                record = normalize_row(_row(store=raw_store), source_row_number=1)

                self.assertEqual(record.canonical_store, "downtown")
                self.assertIn("normalized_store_name", record.quality_notes)

    def test_product_aliases_normalize_to_canonical_names(self) -> None:
        for raw_product in ["Coffee-Beans", "coffee bean"]:
            with self.subTest(raw_product=raw_product):
                record = normalize_row(_row(product=raw_product), source_row_number=1)

                self.assertEqual(record.product_name, "coffee beans")
                self.assertIn("normalized_product_name", record.quality_notes)

    def test_price_parser_handles_symbols_commas_currency_and_invalid_values(self) -> None:
        symbol = normalize_row(_row(price="$12.99"), source_row_number=1)
        comma = normalize_row(_row(price="13,49"), source_row_number=1)
        currency = normalize_row(_row(price="USD 6.50"), source_row_number=1)
        invalid = normalize_row(_row(price="bad-price"), source_row_number=1)

        self.assertEqual(symbol.price, 12.99)
        self.assertIn("parsed_price_symbol", symbol.quality_notes)
        self.assertEqual(comma.price, 13.49)
        self.assertIn("parsed_price_comma_decimal", comma.quality_notes)
        self.assertEqual(currency.price, 6.50)
        self.assertIn("parsed_price_symbol", currency.quality_notes)
        self.assertEqual(invalid.price, 0.0)
        self.assertIn("defaulted_invalid_price", invalid.quality_notes)

    def test_date_parser_handles_mixed_formats_and_invalid_values(self) -> None:
        cases = {
            "2026-06-01": ("2026-06-01", False),
            "06/02/2026": ("2026-06-02", True),
            "2026/06/03": ("2026-06-03", True),
            "Jun 04 2026": ("2026-06-04", True),
            "not-a-date": ("1970-01-01", False),
        }

        for raw_date, (expected, should_note_format) in cases.items():
            with self.subTest(raw_date=raw_date):
                record = normalize_row(_row(sale_date=raw_date), source_row_number=1)

                self.assertEqual(record.sale_date, expected)
                if should_note_format:
                    self.assertIn("parsed_date_format", record.quality_notes)

        invalid = normalize_row(_row(sale_date="not-a-date"), source_row_number=1)
        self.assertIn("defaulted_invalid_date", invalid.quality_notes)

    def test_quantity_parser_handles_text_missing_and_negative_values(self) -> None:
        text = normalize_row(_row(quantity="qty: 7 units"), source_row_number=1)
        missing = normalize_row(_row(quantity=""), source_row_number=1)
        negative = normalize_row(_row(quantity="-2"), source_row_number=1)

        self.assertEqual(text.quantity, 7)
        self.assertIn("parsed_quantity_text", text.quality_notes)
        self.assertEqual(missing.quantity, 0)
        self.assertIn("defaulted_missing_quantity", missing.quality_notes)
        self.assertEqual(negative.quantity, 0)
        self.assertIn("clamped_negative_quantity", negative.quality_notes)

    def test_reorder_signal_thresholds_are_deterministic(self) -> None:
        self.assertEqual(reorder_signal("coffee beans", 18), "ok")
        self.assertEqual(reorder_signal("coffee beans", 10), "watch")
        self.assertEqual(reorder_signal("coffee beans", 5), "reorder")
        self.assertEqual(reorder_signal("coffee beans", 0), "stockout")

    def test_normalize_csv_dedupes_duplicate_source_rows_first_occurrence_wins(self) -> None:
        with TemporaryDirectory() as tmpdir:
            csv_path = Path(tmpdir) / "messy.csv"
            csv_path.write_text(
                "\n".join(
                    [
                        "store,product,quantity,price,sale_date",
                        "DT,coffee bean,4,\"13,49\",06/02/2026",
                        "North,oatmilk,0,$4.20,2026/06/03",
                        "DT,coffee bean,4,\"13,49\",06/02/2026",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )

            records = normalize_csv(csv_path)

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].source_row_number, 1)
        self.assertEqual(records[1].source_row_number, 2)

    def test_normalized_record_preserves_worker_json_contract(self) -> None:
        record = asdict(normalize_row(_row(), source_row_number=1))

        self.assertEqual(
            set(record),
            {
                "source_row_number",
                "source_row_hash",
                "canonical_store",
                "product_name",
                "quantity",
                "price",
                "sale_date",
                "normalized_payload",
                "quality_notes",
                "reorder_signal",
            },
        )
        self.assertIsInstance(record["source_row_hash"], str)
        self.assertIsInstance(record["normalized_payload"], dict)
        self.assertIsInstance(record["quality_notes"], list)


def _row(
    *,
    store: str = "Downtown Store",
    product: str = "Coffee-Beans",
    quantity: str = "18",
    price: str = "$12.99",
    sale_date: str = "2026-06-01",
) -> dict[str, str]:
    return {
        "store": store,
        "product": product,
        "quantity": quantity,
        "price": price,
        "sale_date": sale_date,
    }
