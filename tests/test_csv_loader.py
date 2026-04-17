# tests/test_csv_loader.py
import io
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from web.csv_loader import load_csv, lookup_by_barcode

SAMPLE_CSV = """Barcode,Brand,Product Name,EWG Score,Ingredients,Cancer Concern,Allergies & Immunotoxicity,Developmental & Reproductive Toxicity,Use Restrictions,Flagged Ingredients,Yuka Score
"0792850002722, 0792850140998",Burt's Bees,Beeswax Lip Balm,1,"Cera alba, mentha piperita oil",,,,,"Peppermint Oil (Score 04)",90/100 (excellent)
020714922689,Clinique,Clinique Lipstick,5,"Ethylhexyl Palmitate, Ozokerite",MODERATE,HIGH,MODERATE,HIGH,"Ricinus Communis Oil, Alumina Oxide",25/100 (moderate)
"""


@pytest.fixture
def db(tmp_path):
    csv_file = tmp_path / "test.csv"
    csv_file.write_text(SAMPLE_CSV, encoding="utf-8")
    return load_csv(str(csv_file))


def test_single_barcode_lookup(db):
    result = lookup_by_barcode(db, "020714922689")
    assert result is not None
    assert result["product"]["name"] == "Clinique Lipstick"
    assert result["product"]["brand"] == "Clinique"


def test_multi_barcode_first(db):
    result = lookup_by_barcode(db, "0792850002722")
    assert result is not None
    assert result["product"]["name"] == "Beeswax Lip Balm"


def test_multi_barcode_second(db):
    result = lookup_by_barcode(db, "0792850140998")
    assert result is not None
    assert result["product"]["name"] == "Beeswax Lip Balm"


def test_missing_barcode_returns_none(db):
    assert lookup_by_barcode(db, "9999999") is None


def test_ewg_score(db):
    result = lookup_by_barcode(db, "020714922689")
    assert result["scores"]["compilation_score"] == 5


def test_grade_good(db):
    result = lookup_by_barcode(db, "0792850002722")
    assert result["scores"]["compilation_grade"] == "Clean Girl"
    assert result["scores"]["compilation_label"] == "Low hazard"
    assert result["scores"]["databases"]["ewg"]["grade"] == "GOOD"


def test_grade_moderate(db):
    result = lookup_by_barcode(db, "020714922689")
    assert result["scores"]["compilation_grade"] == "Proceed with Glam"
    assert result["scores"]["compilation_label"] == "Moderate hazard"
    assert result["scores"]["databases"]["ewg"]["grade"] == "MODERATE"


def test_concerns_non_empty_only(db):
    result = lookup_by_barcode(db, "020714922689")
    concerns = result["scores"]["all_concerns"]
    assert "Cancer Concern" in concerns
    assert "Allergies & Immunotoxicity" in concerns
    assert len(concerns) == 4


def test_no_concerns_empty_list(db):
    result = lookup_by_barcode(db, "0792850002722")
    assert result["scores"]["all_concerns"] == []


def test_flagged_ingredients_parsed(db):
    result = lookup_by_barcode(db, "020714922689")
    flagged = result["scores"]["all_flagged_ingredients"]
    assert len(flagged) == 2
    assert flagged[0]["name"] == "Ricinus Communis Oil"
    assert flagged[0]["score"] == 5
    assert isinstance(flagged[0]["concerns"], list)


def test_flagged_ingredient_annotation_stripped(db):
    result = lookup_by_barcode(db, "0792850002722")
    flagged = result["scores"]["all_flagged_ingredients"]
    assert flagged[0]["name"] == "Peppermint Oil"


def test_yuka_score(db):
    result = lookup_by_barcode(db, "020714922689")
    assert result["scores"]["yuka_score"] == "25/100 (moderate)"


def test_ingredients_list(db):
    result = lookup_by_barcode(db, "020714922689")
    assert "Ethylhexyl Palmitate" in result["product"]["ingredients"]


def test_alternatives_always_empty(db):
    result = lookup_by_barcode(db, "020714922689")
    assert result["alternatives"] == {"same_brand": [], "other_brand": []}
