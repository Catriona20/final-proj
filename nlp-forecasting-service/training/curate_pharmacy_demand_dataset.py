#!/usr/bin/env python3
"""
curate_pharmacy_demand_dataset.py

Module 11: Pharmacy Demand Dataset Ingestion & Curation Pipeline.
Transforms raw wide-format pharma sales data (salesdaily.csv) into canonical
normalized long-format time series, enforces non-negative constraints, ensures
unbroken continuous daily grids, and executes a strict chronological train/test split.

Output Files:
- data/processed/pharmacy_demand_train.csv (2014-01-02 through 2018-12-31)
- data/processed/pharmacy_demand_test.csv  (2019-01-01 through 2019-10-08)
"""

import sys
import csv
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("curate_pharmacy_demand")

# Canonical Module 11 ATC Mapping
ATC_CATALOG_MAPPING: Dict[str, Dict[str, str]] = {
    "M01AB": {
        "medicine_id": "MED-ATC-M01AB",
        "medicine_name": "Diclofenac",
        "category": "Anti-inflammatory",
    },
    "M01AE": {
        "medicine_id": "MED-ATC-M01AE",
        "medicine_name": "Ibuprofen",
        "category": "Anti-inflammatory",
    },
    "N02BA": {
        "medicine_id": "MED-ATC-N02BA",
        "medicine_name": "Aspirin",
        "category": "Analgesic",
    },
    "N02BE": {
        "medicine_id": "MED-ATC-N02BE",
        "medicine_name": "Paracetamol",
        "category": "Analgesic",
    },
    "N05B": {
        "medicine_id": "MED-ATC-N05B",
        "medicine_name": "Diazepam",
        "category": "Anxiolytic",
    },
    "N05C": {
        "medicine_id": "MED-ATC-N05C",
        "medicine_name": "Hypnotic/Sedative",
        "category": "Sedative",
    },
    "R03": {
        "medicine_id": "MED-ATC-R03",
        "medicine_name": "Salbutamol",
        "category": "Respiratory",
    },
    "R06": {
        "medicine_id": "MED-ATC-R06",
        "medicine_name": "Cetirizine",
        "category": "Antihistamine",
    },
}

CANONICAL_COLUMNS = [
    "date",
    "medicine_id",
    "medicine_name",
    "category",
    "quantity_dispensed",
]

# Strict Chronological Split Boundaries
TRAIN_START_DATE = "2014-01-02"
TRAIN_END_DATE = "2018-12-31"
TEST_START_DATE = "2019-01-01"
TEST_END_DATE = "2019-10-08"


def parse_flexible_date(date_str: str) -> str:
    """
    Parses date strings in diverse formats (YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY, YYYY/MM/DD)
    into standard ISO-8601 YYYY-MM-DD.
    """
    date_str = date_str.strip()
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%m/%d/%y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    raise ValueError(f"Unable to parse date string: '{date_str}' into ISO YYYY-MM-DD format.")


def curate_dataset(raw_csv_path: Path, output_dir: Path) -> bool:
    """
    Loads, cleans, normalizes, validates, and splits the pharmacy demand dataset.
    """
    if not raw_csv_path.exists():
        logger.error(
            "Raw dataset file not found: %s\n"
            "Please ensure 'salesdaily.csv' is placed inside 'nlp-forecasting-service/data/raw/'.",
            raw_csv_path,
        )
        return False

    logger.info("Loading raw dataset from: %s", raw_csv_path)

    # 1. Read Raw CSV
    raw_rows: List[Dict[str, str]] = []
    with open(raw_csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        for row in reader:
            raw_rows.append(row)

    total_raw_rows = len(raw_rows)
    logger.info("Loaded %d raw rows. Columns: %s", total_raw_rows, fieldnames)

    # Identify Date Column (supports 'datum', 'Date', 'date', 'DATE')
    date_col = None
    for candidate in ["datum", "Date", "date", "DATE"]:
        if candidate in fieldnames:
            date_col = candidate
            break

    if not date_col:
        raise KeyError(
            f"Schema Error: No valid date column found in {fieldnames}. Expected 'datum' or 'Date'."
        )

    # Validate that all required ATC columns exist
    missing_atc = [atc for atc in ATC_CATALOG_MAPPING.keys() if atc not in fieldnames]
    if missing_atc:
        raise KeyError(
            f"Schema Error: Missing required ATC columns in raw dataset: {missing_atc}"
        )

    # 2. Melt Wide Format to Long Records & Validate
    raw_long_records: Dict[Tuple[str, str], float] = {}
    duplicates_count = 0
    negative_values_found = 0

    for row_idx, row in enumerate(raw_rows, start=1):
        raw_date = row.get(date_col, "").strip()
        if not raw_date:
            logger.warning("Skipping row %d with empty date.", row_idx)
            continue

        try:
            iso_date = parse_flexible_date(raw_date)
        except ValueError as e:
            raise ValueError(f"Row {row_idx}: {e}") from e

        for atc_code, meta in ATC_CATALOG_MAPPING.items():
            raw_qty_str = row.get(atc_code, "").strip()
            if not raw_qty_str:
                qty = 0.0
            else:
                try:
                    qty = float(raw_qty_str)
                except ValueError as e:
                    raise ValueError(
                        f"Row {row_idx}, Column {atc_code}: Cannot parse '{raw_qty_str}' as float."
                    ) from e

            # Reject negative demand
            if qty < 0:
                negative_values_found += 1
                raise ValueError(
                    f"Integrity Violation: Row {row_idx}, Column {atc_code} contains negative quantity ({qty})."
                )

            key = (iso_date, meta["medicine_id"])
            if key in raw_long_records:
                duplicates_count += 1
                raw_long_records[key] += qty  # Aggregate duplicate observations by sum
            else:
                raw_long_records[key] = qty

    logger.info(
        "Melted into %d unique (date, medicine) aggregated records. (Duplicates aggregated: %d)",
        len(raw_long_records),
        duplicates_count,
    )

    # 3. Ensure Continuous Daily Date Grid per Medicine
    all_dates = sorted(list({k[0] for k in raw_long_records.keys()}))
    if not all_dates:
        raise ValueError("No valid date records found in dataset.")

    dataset_min_date = datetime.strptime(all_dates[0], "%Y-%m-%d").date()
    dataset_max_date = datetime.strptime(all_dates[-1], "%Y-%m-%d").date()
    total_calendar_days = (dataset_max_date - dataset_min_date).days + 1

    logger.info(
        "Detected overall date span: %s to %s (%d calendar days)",
        dataset_min_date,
        dataset_max_date,
        total_calendar_days,
    )

    complete_long_rows: List[Dict[str, any]] = []
    missing_dates_inserted = 0

    for atc_code, meta in ATC_CATALOG_MAPPING.items():
        m_id = meta["medicine_id"]
        m_name = meta["medicine_name"]
        m_cat = meta["category"]

        current_dt = dataset_min_date
        while current_dt <= dataset_max_date:
            date_str = current_dt.strftime("%Y-%m-%d")
            key = (date_str, m_id)

            if key in raw_long_records:
                qty = raw_long_records[key]
            else:
                qty = 0.0
                missing_dates_inserted += 1

            complete_long_rows.append({
                "date": date_str,
                "medicine_id": m_id,
                "medicine_name": m_name,
                "category": m_cat,
                "quantity_dispensed": round(qty, 4),
            })
            current_dt += timedelta(days=1)

    # 4. Sort strictly by medicine_id and date
    complete_long_rows.sort(key=lambda r: (r["medicine_id"], r["date"]))
    total_cleaned_rows = len(complete_long_rows)

    # 5. Perform Strict Chronological Train/Test Split
    train_rows = [r for r in complete_long_rows if TRAIN_START_DATE <= r["date"] <= TRAIN_END_DATE]
    test_rows = [r for r in complete_long_rows if TEST_START_DATE <= r["date"] <= TEST_END_DATE]

    output_dir.mkdir(parents=True, exist_ok=True)
    train_csv_path = output_dir / "pharmacy_demand_train.csv"
    test_csv_path = output_dir / "pharmacy_demand_test.csv"

    def write_canonical_csv(filepath: Path, rows: List[Dict[str, any]]):
        with open(filepath, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=CANONICAL_COLUMNS)
            writer.writeheader()
            writer.writerows(rows)

    write_canonical_csv(train_csv_path, train_rows)
    write_canonical_csv(test_csv_path, test_rows)

    logger.info("Saved Training Set: %s (%d rows)", train_csv_path.name, len(train_rows))
    logger.info("Saved Test Set    : %s (%d rows)", test_csv_path.name, len(test_rows))

    # 6. Detailed Summary Output
    print("\n" + "=" * 90)
    print("MODULE 11: DATASET CURATION & QUALITY SUMMARY")
    print("=" * 90)
    print(f"Raw Input Rows             : {total_raw_rows:,}")
    print(f"Total Normalized Rows      : {total_cleaned_rows:,}")
    print(f"Unique Medicines / SKUs    : {len(ATC_CATALOG_MAPPING)}")
    print(f"Overall Date Range         : {dataset_min_date} to {dataset_max_date} ({total_calendar_days} days)")
    print(f"Missing Dates Imputed (=0) : {missing_dates_inserted}")
    print(f"Duplicate Keys Aggregated  : {duplicates_count}")
    print(f"Negative Values Encountered: {negative_values_found}")
    print("-" * 90)
    print(f"Chronological Train Set    : {len(train_rows):,} rows ({TRAIN_START_DATE} to {TRAIN_END_DATE})")
    print(f"Chronological Test Set     : {len(test_rows):,} rows ({TEST_START_DATE} to {TEST_END_DATE})")
    print("-" * 90)
    print(f"{'Medicine ID':<18} {'Name':<18} {'Category':<18} {'Total Units':<12} {'Daily Mean':<12} {'Zero Days %'}")
    print("-" * 90)

    for atc_code, meta in ATC_CATALOG_MAPPING.items():
        m_id = meta["medicine_id"]
        med_rows = [r for r in complete_long_rows if r["medicine_id"] == m_id]
        quantities = [r["quantity_dispensed"] for r in med_rows]
        total_units = sum(quantities)
        daily_mean = total_units / len(quantities) if quantities else 0
        zero_days = sum(1 for q in quantities if q == 0)
        zero_pct = (zero_days / len(quantities) * 100) if quantities else 0

        print(
            f"{m_id:<18} {meta['medicine_name']:<18} {meta['category']:<18} "
            f"{total_units:<12.1f} {daily_mean:<12.2f} {zero_pct:.1f}% ({zero_days}/{len(quantities)})"
        )
    print("=" * 90)
    print("CURATION COMPLETED SUCCESSFULLY")
    print("=" * 90 + "\n")
    return True


def main():
    base_dir = Path(__file__).resolve().parent.parent
    raw_csv_path = base_dir / "data" / "raw" / "salesdaily.csv"
    output_dir = base_dir / "data" / "processed"

    curate_dataset(raw_csv_path, output_dir)


if __name__ == "__main__":
    main()
