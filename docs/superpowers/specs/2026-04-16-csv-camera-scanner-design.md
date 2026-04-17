# Design: CSV-Backed Camera Barcode Scanner

**Date:** 2026-04-16
**Project:** Verity™ Skincare Scanner
**Platform:** Raspberry Pi (Bookworm OS) with attached display and camera

---

## Summary

Replace the EWG and Open Beauty Facts API integrations with a local CSV file lookup. Users scan product barcodes using the Pi's camera directly in the browser. The Flask server loads the CSV at startup and serves product data via the existing HTTP endpoints. The frontend adds a live camera view using ZXing-js for barcode detection.

---

## Architecture

```
[Pi Camera] → [Chromium browser - ZXing-js] → [/scan/<barcode>] → [Flask server] → [CSV dict lookup] → [JSON response] → [Result display]
```

No external API calls. All product data comes from `cosmetics_data.csv` loaded into memory at startup.

---

## Section 1 — Data Layer

### New file: `web/csv_loader.py`

Loads `cosmetics_data.csv` at Flask startup into a Python dict keyed by barcode string.

**Multi-barcode handling:** Some products list multiple barcodes in a single cell (e.g. `"0792850002722, 0792850140998"`). Each barcode variant gets its own dict entry pointing to the same product record.

**Public interface:**
```python
def load_csv(path: str) -> dict[str, dict]
def lookup_by_barcode(db: dict, barcode: str) -> dict | None
```

**CSV column → response field mapping:**

| CSV Column | Response Field |
|---|---|
| `Barcode` | used as lookup key |
| `Brand` | `product.brand` |
| `Product Name` | `product.name` |
| `EWG Score` | `score.compiled` |
| `Ingredients` | `product.ingredients` (split on `, `) |
| `Cancer Concern` | `concerns` list |
| `Allergies & Immunotoxicity` | `concerns` list |
| `Developmental & Reproductive Toxicity` | `concerns` list |
| `Use Restrictions` | `concerns` list |
| `Flagged Ingredients` | `flagged_ingredients` |
| `Yuka Score` | `score.yuka_score` (new field) |

**Concern normalisation:** Only concern columns with a non-empty value are included in the concerns list. Empty cells are skipped.

**Score rating:** EWG Score is mapped to a rating band using existing thresholds from `config.json` (`good_max`, `moderate_max`).

---

## Section 2 — Server Changes

### Modified: `web/web_server.py`

**Remove:**
- Imports: `lookup_product`, `score_product`, `find_alternatives`
- All API call logic in `/scan/<barcode>` and `/product/<barcode>` routes

**Add:**
- `from web.csv_loader import load_csv, lookup_by_barcode`
- At startup: load CSV into a module-level `PRODUCT_DB` dict
- CSV path: `../verify/cosmetics_data.csv` relative to `web_server.py`, configurable

**`/scan/<barcode>` new logic:**
1. Call `lookup_by_barcode(PRODUCT_DB, barcode)`
2. If not found → 404 with `{"ok": false, "error": "Product not found"}`
3. Shape CSV data into existing response format (see mapping above)
4. Return JSON — same shape as before, plus `score.yuka_score`

**`/product/<barcode>` new logic:**
1. Same lookup, return raw product fields only (no scoring)

**Unchanged routes:** `/health`, `/config`, `/` (static file serving)

---

## Section 3 — Frontend Camera UI

### Modified: `web/index.html`

**Library:** ZXing-js loaded via CDN (`@zxing/library`). Works with Pi Camera and USB cameras on Chromium Bookworm.

**New UI elements:**
- `<video>` element showing live camera feed
- Targeting overlay (CSS) to guide product placement
- "Scan Again" button shown after a result is displayed
- "Product not found" state with "Try Again" button

**Scan flow:**
1. Page loads → camera starts automatically
2. ZXing reads frames continuously
3. On barcode detection → camera stops → fetch `/scan/<barcode>` → display result
4. User presses "Scan Again" → camera restarts

**Result display:** Reuses existing product name, brand, score badge, concerns, and flagged ingredients panels. Yuka Score displayed as a new field alongside the EWG score.

**No changes to:** CSS variables, fonts, animations, or overall page structure.

---

## Files Changed

| File | Change |
|---|---|
| `web/csv_loader.py` | **New** — CSV loading and barcode lookup |
| `web/web_server.py` | **Modified** — remove API imports, add CSV lookup |
| `web/index.html` | **Modified** — add camera UI and ZXing-js |
| `verify/cosmetics_data.csv` | **Unchanged** — data source |
| `api/`, `scorer.py`, `alternatives.py` | **Unused** — not deleted yet, can be removed later |

---

## Out of Scope

- Modifying the terminal scanner (`main.py`) — it can remain as-is
- Adding search-by-name functionality
- Editing or uploading new CSVs through the UI
- Authentication or access control
