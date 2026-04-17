# web/csv_loader.py
import csv
import re


def _grade(score: int) -> str:
    if score <= 3:
        return "GOOD"
    elif score <= 6:
        return "MODERATE"
    return "BAD"


def _compilation_grade(score: int) -> str:
    if score <= 3:
        return "Clean Girl"
    elif score <= 6:
        return "Proceed with Glam"
    return "Red Flag, babe"


def _compilation_label(score: int) -> str:
    if score <= 3:
        return "Low hazard"
    elif score <= 6:
        return "Moderate hazard"
    return "High hazard"


def _parse_flagged_ingredients(raw: str, ewg_score: int, concerns: list) -> list:
    if not raw or not raw.strip():
        return []
    parts = re.split(r',\s+(?![^(]*\))', raw)
    result = []
    for part in parts:
        name = re.sub(r'\s*\([^)]*\)\s*$', '', part.strip())
        if name:
            result.append({"name": name, "score": ewg_score, "concerns": concerns})
    return result


def load_csv(path: str) -> dict:
    db = {}
    concern_cols = [
        "Cancer Concern",
        "Allergies & Immunotoxicity",
        "Developmental & Reproductive Toxicity",
        "Use Restrictions",
    ]
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_barcodes = row.get("Barcode", "")
            barcodes = [b.strip() for b in raw_barcodes.split(",") if b.strip()]
            ewg_score = int(row.get("EWG Score", 0) or 0)
            concerns = [col for col in concern_cols if row.get(col, "").strip()]
            flagged = _parse_flagged_ingredients(
                row.get("Flagged Ingredients", ""), ewg_score, concerns
            )
            ingredients = [
                i.strip()
                for i in row.get("Ingredients", "").split(",")
                if i.strip()
            ]
            record = {
                "product": {
                    "name": row.get("Product Name", "").strip(),
                    "brand": row.get("Brand", "").strip(),
                    "ingredients": ingredients,
                },
                "scores": {
                    "compilation_score": ewg_score,
                    "compilation_grade": _compilation_grade(ewg_score),
                    "compilation_label": _compilation_label(ewg_score),
                    "yuka_score": row.get("Yuka Score", "").strip(),
                    "databases": {
                        "ewg": {
                            "score": ewg_score,
                            "grade": _grade(ewg_score),
                            "source": "csv",
                        }
                    },
                    "all_concerns": concerns,
                    "all_flagged_ingredients": flagged,
                },
                "alternatives": {"same_brand": [], "other_brand": []},
            }
            for barcode in barcodes:
                db[barcode] = record
    return db


def lookup_by_barcode(db: dict, barcode: str) -> dict | None:
    return db.get(barcode.strip())
