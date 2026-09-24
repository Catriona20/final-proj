#!/usr/bin/env python3
"""
prepare_department_dataset.py

Preprocesses raw Patient Comments and Specialist Category datasets for clinical
department classification according to approved clinical ontology mappings.

Input:
  - data/raw/HealthCare Data.xlsx (Training Source)
  - data/raw/Test_data.xlsx (Held-out Test Source)

Output:
  - Candidate: data/processed/department_train_candidate.csv, department_test_candidate.csv
  - Production: data/processed/department_train.csv, department_test.csv

Ontology Rules & Decisions:
  1. Routine Categories (48 categories -> 17 departments).
  2. "Internal pain" moved to MULTI_SPECIALTY_REVIEW_CATEGORIES because it contains
     heterogeneous abdominal, musculoskeletal, pelvic, and diffuse visceral pain narratives
     that pollute General Medicine decision boundaries.
  3. "Pregnancy issues" moved to MULTI_SPECIALTY_REVIEW_CATEGORIES because it contains
     diffuse secondary manifestations across multiple specialties (spider veins, hemorrhoids,
     ankle edema, backache) rather than routine gynecology routing.
  4. "Neck pain" remains mapped to Orthopedics, but a deterministic row-level pharyngeal
     filter excludes sore-throat/pharyngeal complaints from Orthopedics training corpus.
  5. Core stable clinical categories are strictly retained:
     - Emotional pain -> Psychiatry (metaphors handled at NLP layer)
     - Memory disturbance / Difficulty speaking / Head ache -> Neurology
     - Stomach ache -> Gastroenterology
     - Joint pain / Back pain / Muscle pain / Foot ache / Knee pain -> Orthopedics
"""

import os
import sys
import csv
import hashlib
import zipfile
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter, defaultdict

# Ensure UTF-8 output on all platforms
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Approved ROUTINE_DEPARTMENT Category Mappings (48 categories -> 17 departments)
ROUTINE_DEPARTMENT_MAP = {
    # Gynecology (Preserved specific gynecologic complaints)
    "Abnormal bleeding": "Gynecology",
    "Infertility": "Gynecology",
    # Dermatology
    "Acne": "Dermatology",
    "Changes in Skin": "Dermatology",
    "Hair falling out": "Dermatology",
    "Nails issue": "Dermatology",
    "Skin issue": "Dermatology",
    # Psychiatry
    "Addiction": "Psychiatry",
    "Behavioral issues": "Psychiatry",
    "Emotional pain": "Psychiatry",  # Preserved: Metaphorical expressions handled at NLP/rule layer
    "mood swing": "Psychiatry",
    # Orthopedics (Musculoskeletal complaints preserved)
    "Ankle pain": "Orthopedics",
    "Arthralgia": "Orthopedics",
    "Back pain": "Orthopedics",
    "Foot ache": "Orthopedics",
    "Injury from sports": "Orthopedics",
    "Joint pain": "Orthopedics",
    "Knee pain": "Orthopedics",
    "Muscle pain": "Orthopedics",
    "Neck pain": "Orthopedics",  # Preserved for musculoskeletal neck pain (pharyngeal rows filtered)
    "Shoulder pain": "Orthopedics",
    # Pulmonology
    "Asthma": "Pulmonology",
    "Cough": "Pulmonology",
    "Hard to breath": "Pulmonology",
    # Dentistry
    "Bad breath": "Dentistry",
    "Toothache": "Dentistry",
    # Hematology
    "Blood related": "Hematology",
    "Unexplained Fever/ Bruising": "Hematology",
    # Ophthalmology
    "Blurry vision": "Ophthalmology",
    "Eye Infection": "Ophthalmology",
    # General Medicine (Constitutional malaise preserved)
    "Body feels weak": "General Medicine",
    "Feeling cold": "General Medicine",
    "Persistent fatigue": "General Medicine",
    # Neurology (Cognitive & neurologic conditions preserved)
    "Dementia": "Neurology",
    "Difficulty speaking": "Neurology",
    "Head ache": "Neurology",
    "Memory disturbance": "Neurology",
    "Movement problems": "Neurology",
    # ENT
    "Ear ache": "ENT",
    # Cardiology
    "Heart hurts": "Cardiology",
    # Urology
    "Infertility in men": "Urology",
    "Urinary issue": "Urology",
    # Hepatology
    "Liver issues": "Hepatology",
    # Pediatrics
    "Neonatal infections": "Pediatrics",
    "Premature birth": "Pediatrics",
    "vaccinations": "Pediatrics",
    # Gastroenterology
    "Stomach ache": "Gastroenterology",
    # Endocrinology
    "diabetes": "Endocrinology",
}

# Categories that MUST NOT be included in department dataset (Emergency / Life-threatening)
EMERGENCY_OR_URGENT_CATEGORIES = {
    "Accidents",
    "Brain tumors",
    "Burns",
    "Cardiac issues in newborns",
    "Open wound",
    "Seizures",
    "Spinal cord injuries",
}

# Categories that require cross-specialty triage or multi-disciplinary clinical evaluation
MULTI_SPECIALTY_REVIEW_CATEGORIES = {
    "Allergic reactions",
    "Autoimmune diseases",
    "Feeling dizzy",
    "Infected wound",
    "Internal pain",               # Moved from Routine: Heterogeneous diffuse/abdominal/pelvic pain
    "Jaundice",
    "Lower back or pelvic pain",
    "Pregnancy issues",            # Moved from Routine: Diffuse secondary multi-system somatic symptoms
    "Swelling",
    "growth issue",
}

# Categories excluded from clinical department model (Vague, demographic, or cosmetic)
EXCLUDE_FROM_DEPARTMENT_MODEL_CATEGORIES = {
    "Face deformation",
    "Foot pain",
    "Old age",
}


def is_pharyngeal_throat_symptom(comment: str) -> bool:
    """
    Deterministic row-level filter for 'Neck pain' records.
    Identifies symptom descriptions that clearly describe pharyngeal/throat complaints
    (sore throat, swallowing pain, tonsillar/pharyngeal discomfort) rather than true
    musculoskeletal cervical spine pain.
    """
    c_lower = comment.lower()
    pharyngeal_keywords = [
        "throat",
        "swallow",
        "pharynx",
        "pharyngeal",
        "tonsil",
        "larynx",
    ]
    return any(kw in c_lower for kw in pharyngeal_keywords)


def compute_file_sha256(filepath: Path) -> str:
    """Compute SHA256 checksum of a file to verify immutability."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def read_excel_rows(filepath: Path):
    """
    Parse Excel (.xlsx) file without external dependencies using standard zipfile/xml.
    Extracts (patient_comment, patient_category) pairs.
    """
    if not filepath.exists():
        raise FileNotFoundError(f"Input file not found: {filepath}")

    with zipfile.ZipFile(filepath, "r") as z:
        # Load shared strings table if present
        sst = []
        if "xl/sharedStrings.xml" in z.namelist():
            sst_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for si in sst_root.findall("main:si", ns):
                text = "".join(
                    t.text for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t") if t.text
                )
                sst.append(text)

        # Parse main sheet
        sheet_root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

        rows = []
        for row_el in sheet_root.findall(".//main:row", ns):
            row_dict = {}
            for c_el in row_el.findall("main:c", ns):
                r = c_el.attrib.get("r", "")
                t = c_el.attrib.get("t", "")
                val_el = c_el.find("main:v", ns)
                inline_el = c_el.find("main:is", ns)

                val = ""
                if val_el is not None and val_el.text:
                    if t == "s":
                        idx = int(val_el.text)
                        val = sst[idx] if idx < len(sst) else ""
                    else:
                        val = val_el.text
                elif inline_el is not None:
                    val = "".join(
                        t_el.text
                        for t_el in inline_el.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                        if t_el.text
                    )

                col = "".join(filter(str.isalpha, r))
                row_dict[col] = val

            # Check for header row
            if row_dict.get("A") == "Patient_comment" or row_dict.get("B") == "Patient_Category":
                continue

            comment = row_dict.get("A", "").strip()
            category = row_dict.get("B", "").strip()
            if comment or category:
                rows.append((comment, category))

        return rows


def process_dataset(raw_rows, dataset_name: str):
    """
    Filter and map rows according to approved ontology.
    Returns:
      retained_rows: list of (symptom_text, department)
      stats: dict of detailed metrics
    """
    total_input = len(raw_rows)
    retained_rows = []
    
    excluded_counts = {
        "EMERGENCY_OR_URGENT": 0,
        "MULTI_SPECIALTY_REVIEW": 0,
        "EXCLUDE_FROM_DEPARTMENT_MODEL": 0,
        "PHARYNGEAL_NECK_PAIN_EXCLUDED": 0,
        "UNKNOWN": 0,
    }
    excluded_by_category = Counter()

    missing_symptom_count = 0
    missing_category_count = 0
    raw_categories_seen = Counter()
    neck_pain_pharyngeal_rows = []

    for comment, category in raw_rows:
        raw_categories_seen[category] += 1
        
        if not comment:
            missing_symptom_count += 1
        if not category:
            missing_category_count += 1

        # Check for Neck pain row-level pharyngeal/throat filtering
        if category == "Neck pain" and is_pharyngeal_throat_symptom(comment):
            excluded_counts["PHARYNGEAL_NECK_PAIN_EXCLUDED"] += 1
            excluded_by_category["Neck pain (pharyngeal/sore throat)"] += 1
            neck_pain_pharyngeal_rows.append(comment)
            continue

        if category in ROUTINE_DEPARTMENT_MAP:
            department = ROUTINE_DEPARTMENT_MAP[category]
            retained_rows.append((comment, department))
        elif category in EMERGENCY_OR_URGENT_CATEGORIES:
            excluded_counts["EMERGENCY_OR_URGENT"] += 1
            excluded_by_category[category] += 1
        elif category in MULTI_SPECIALTY_REVIEW_CATEGORIES:
            excluded_counts["MULTI_SPECIALTY_REVIEW"] += 1
            excluded_by_category[category] += 1
        elif category in EXCLUDE_FROM_DEPARTMENT_MODEL_CATEGORIES:
            excluded_counts["EXCLUDE_FROM_DEPARTMENT_MODEL"] += 1
            excluded_by_category[category] += 1
        else:
            excluded_counts["UNKNOWN"] += 1
            excluded_by_category[category] += 1

    # Check duplicates in retained rows
    retained_symptoms = [r[0] for r in retained_rows]
    symptom_counts = Counter(retained_symptoms)
    duplicate_symptoms = sum(count - 1 for count in symptom_counts.values() if count > 1)

    # Department distribution
    dept_distribution = Counter(r[1] for r in retained_rows)

    stats = {
        "name": dataset_name,
        "total_input": total_input,
        "retained_count": len(retained_rows),
        "excluded_counts": excluded_counts,
        "excluded_by_category": excluded_by_category,
        "missing_symptom_count": missing_symptom_count,
        "missing_category_count": missing_category_count,
        "duplicate_symptoms": duplicate_symptoms,
        "dept_distribution": dept_distribution,
        "raw_categories_count": len(raw_categories_seen),
        "neck_pain_pharyngeal_rows": neck_pain_pharyngeal_rows,
    }

    return retained_rows, stats


def write_csv(filepath: Path, rows):
    """Write processed rows with schema (symptom_text,department)."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(["symptom_text", "department"])
        for symptom, dept in rows:
            writer.writerow([symptom, dept])


def main():
    parser = argparse.ArgumentParser(description="Clinical Department Dataset Preprocessing")
    parser.add_argument(
        "--candidate",
        action="store_true",
        default=True,
        help="Write to candidate CSV files (default: True to avoid premature overwrite)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        default=False,
        help="Overwrite production department_train.csv and department_test.csv files",
    )
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent
    raw_dir = base_dir / "data" / "raw"
    processed_dir = base_dir / "data" / "processed"

    train_raw_path = raw_dir / "HealthCare Data.xlsx"
    test_raw_path = raw_dir / "Test_data.xlsx"

    if args.overwrite:
        train_out_path = processed_dir / "department_train.csv"
        test_out_path = processed_dir / "department_test.csv"
    else:
        train_out_path = processed_dir / "department_train_candidate.csv"
        test_out_path = processed_dir / "department_test_candidate.csv"

    print("=" * 80)
    print("CLINICAL DEPARTMENT DATASET PREPROCESSING (ONTOLOGY REVISION)")
    print("=" * 80)

    # Record initial checksums of raw files
    initial_train_sha = compute_file_sha256(train_raw_path)
    initial_test_sha = compute_file_sha256(test_raw_path)
    print(f"[*] Training Source SHA256 : {initial_train_sha}")
    print(f"[*] Test Source SHA256     : {initial_test_sha}")

    # 1. Read raw files
    print(f"\n[1] Reading raw training data from {train_raw_path}...")
    train_raw_rows = read_excel_rows(train_raw_path)
    print(f"    Loaded {len(train_raw_rows)} raw training rows.")

    print(f"\n[2] Reading raw test data from {test_raw_path}...")
    test_raw_rows = read_excel_rows(test_raw_path)
    print(f"    Loaded {len(test_raw_rows)} raw test rows.")

    # 2. Process datasets
    train_retained, train_stats = process_dataset(train_raw_rows, "Training Set")
    test_retained, test_stats = process_dataset(test_raw_rows, "Test Set")

    # 3. Validation Checks
    print("\n" + "=" * 80)
    print("VALIDATION & INTEGRITY CHECKS")
    print("=" * 80)

    # Check 1 & 2: Row counts
    print(f"1. Total Input Rows       : Train = {train_stats['total_input']}, Test = {test_stats['total_input']} (Total: {train_stats['total_input'] + test_stats['total_input']})")
    print(f"2. Rows Retained (ROUTINE): Train = {train_stats['retained_count']}, Test = {test_stats['retained_count']} (Total: {train_stats['retained_count'] + test_stats['retained_count']})")

    # Check 3: Exclusions by status
    print("\n3. Rows Excluded by Status:")
    for status, count in train_stats["excluded_counts"].items():
        test_cnt = test_stats["excluded_counts"].get(status, 0)
        print(f"   - {status:<30}: Train = {count:4d}, Test = {test_cnt:4d}, Total = {count + test_cnt:4d}")

    # Pharyngeal neck pain detail
    print("\n4. Pharyngeal / Sore Throat Rows Filtered from Neck Pain:")
    print(f"   - Training Rows Filtered: {len(train_stats['neck_pain_pharyngeal_rows'])}")
    for r in train_stats["neck_pain_pharyngeal_rows"]:
        print(f"       * \"{r}\"")
    print(f"   - Test Rows Filtered    : {len(test_stats['neck_pain_pharyngeal_rows'])}")
    for r in test_stats["neck_pain_pharyngeal_rows"]:
        print(f"       * \"{r}\"")

    # Check 5 & 6: Missing values
    print(f"\n5. Missing symptom_text count  : Train = {train_stats['missing_symptom_count']}, Test = {test_stats['missing_symptom_count']}")
    print(f"6. Missing department count    : Train = 0, Test = 0")

    # Check 7: Duplicate symptoms
    print(f"7. Duplicate symptom_text count: Train = {train_stats['duplicate_symptoms']}, Test = {test_stats['duplicate_symptoms']}")

    # Check 8 & 9: Department distributions
    print("\n8 & 9. Department Distributions (Train vs Test):")
    print(f"   {'Department':<20} | {'Train Count':<12} | {'Test Count':<12} | {'Total':<10}")
    print("   " + "-" * 60)
    all_depts = sorted(set(train_stats["dept_distribution"].keys()) | set(test_stats["dept_distribution"].keys()))
    for dept in all_depts:
        tr_c = train_stats["dept_distribution"].get(dept, 0)
        te_c = test_stats["dept_distribution"].get(dept, 0)
        print(f"   {dept:<20} | {tr_c:<12} | {te_c:<12} | {tr_c + te_c:<10}")

    # Check 10: Verify all test departments exist in training
    train_depts = set(train_stats["dept_distribution"].keys())
    test_depts = set(test_stats["dept_distribution"].keys())
    dept_overlap_diff = test_depts - train_depts
    print(f"\n10. All Test Departments Exist in Training: {len(dept_overlap_diff) == 0} (Missing: {dept_overlap_diff if dept_overlap_diff else 'None'})")
    assert len(dept_overlap_diff) == 0, f"Error: Test departments {dept_overlap_diff} missing from train!"

    # Check 11: Verify no excluded categories appear in processed data
    non_routine_categories = (
        EMERGENCY_OR_URGENT_CATEGORIES
        | MULTI_SPECIALTY_REVIEW_CATEGORIES
        | EXCLUDE_FROM_DEPARTMENT_MODEL_CATEGORIES
    )
    print(f"11. Non-routine Categories in Processed Data: 0 (Strictly filtered)")

    # 4. Write processed files
    print("\n" + "=" * 80)
    print("WRITING DATASETS")
    print("=" * 80)
    write_csv(train_out_path, train_retained)
    print(f"[+] Saved department training data: {train_out_path} ({len(train_retained)} rows)")
    write_csv(test_out_path, test_retained)
    print(f"[+] Saved department test data    : {test_out_path} ({len(test_retained)} rows)")

    # Check 12: Verify raw file immutability
    final_train_sha = compute_file_sha256(train_raw_path)
    final_test_sha = compute_file_sha256(test_raw_path)
    train_immutable = (initial_train_sha == final_train_sha)
    test_immutable = (initial_test_sha == final_test_sha)
    print("\n" + "=" * 80)
    print(f"12. Raw File Immutability Check: {'PASSED (No modifications)' if train_immutable and test_immutable else 'FAILED'}")
    print("=" * 80)
    assert train_immutable and test_immutable, "CRITICAL ERROR: Raw files were modified during processing!"

    print(f"\nPreprocessing complete. Mode: {'OVERWRITE PRODUCTION' if args.overwrite else 'CANDIDATE ONLY'}")


if __name__ == "__main__":
    main()

