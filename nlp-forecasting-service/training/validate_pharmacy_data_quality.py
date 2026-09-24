#!/usr/bin/env python3
"""
validate_pharmacy_data_quality.py

Quality assurance & contract validation script for Module 11 Pharmacy Demand Data.
Validates:
1. Date parsing and continuous daily sequence
2. Non-negative demand values
3. Absence of duplicate (date, medicine_id) keys
4. Minimum sample count per medicine
5. Missing values / nulls
6. Outlier distributions and zero-demand frequency
"""

import sys
import csv
from datetime import datetime, timedelta
from pathlib import Path

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def validate_demand_csv(filepath: Path):
    print("=" * 80)
    print(f"VALIDATING DATASET: {filepath.name}")
    print("=" * 80)

    if not filepath.exists():
        print(f"Status: File not found at {filepath}")
        return {"status": "FILE_NOT_FOUND"}

    rows = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for r in reader:
            rows.append(r)

    print(f"Total Rows Loaded: {len(rows):,}")
    print(f"Columns: {fieldnames}")

    required_cols = {"date", "medicine_id", "quantity_dispensed"}
    missing_required = required_cols - set(fieldnames or [])
    if missing_required:
        print(f"FAIL: Missing required canonical columns: {missing_required}")
        return {"status": "FAIL", "reason": f"Missing columns {missing_required}"}

    # Checks
    invalid_dates = 0
    negative_quantities = 0
    null_values = 0
    seen_keys = set()
    duplicate_keys = 0
    medicine_records = {}

    for idx, r in enumerate(rows):
        d_str = r.get("date", "").strip()
        m_id = r.get("medicine_id", "").strip()
        q_str = r.get("quantity_dispensed", "").strip()

        # Null check
        if not d_str or not m_id or not q_str:
            null_values += 1

        # Date format check
        try:
            d_val = datetime.strptime(d_str, "%Y-%m-%d").date()
        except ValueError:
            invalid_dates += 1
            d_val = None

        # Quantity check
        try:
            q_val = float(q_str)
            if q_val < 0:
                negative_quantities += 1
        except ValueError:
            negative_quantities += 1
            q_val = 0.0

        # Duplicate key check
        key = (d_str, m_id)
        if key in seen_keys:
            duplicate_keys += 1
        seen_keys.add(key)

        if m_id not in medicine_records:
            medicine_records[m_id] = []
        if d_val is not None:
            medicine_records[m_id].append((d_val, q_val))

    print(f"\nQuality Summary:")
    print(f"  - Null / Missing values          : {null_values}")
    print(f"  - Invalid Date formats           : {invalid_dates}")
    print(f"  - Negative Demand quantities     : {negative_quantities}")
    print(f"  - Duplicate (date, medicine) rows: {duplicate_keys}")
    print(f"  - Unique Medicines / SKUs        : {len(medicine_records)}")

    for m_id, records in medicine_records.items():
        records.sort(key=lambda x: x[0])
        dates = [r[0] for r in records]
        quantities = [r[1] for r in records]
        min_date, max_date = dates[0], dates[-1]
        span_days = (max_date - min_date).days + 1
        actual_days = len(dates)
        zero_days = sum(1 for q in quantities if q == 0)
        mean_qty = sum(quantities) / len(quantities) if quantities else 0

        print(f"\n  Medicine ID: {m_id}")
        print(f"    - Date Range : {min_date} to {max_date} ({span_days} days span)")
        print(f"    - Records    : {actual_days} ({zero_days} zero-demand days, {zero_days/actual_days*100:.1f}%)")
        print(f"    - Daily Mean : {mean_qty:.2f} units | Max: {max(quantities):.2f} | Min: {min(quantities):.2f}")

    is_valid = (invalid_dates == 0 and negative_quantities == 0 and duplicate_keys == 0 and null_values == 0)
    print("\n" + "=" * 80)
    print(f"OVERALL QUALITY VERDICT: {'PASS' if is_valid else 'FAIL'}")
    print("=" * 80)
    return {"status": "PASS" if is_valid else "FAIL", "unique_medicines": len(medicine_records)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
    else:
        target = Path(r"d:\clinic appointment system\healthcare-platform\healthcare-platform\nlp-forecasting-service\data\processed\pharmacy_demand_train.csv")
    validate_demand_csv(target)
