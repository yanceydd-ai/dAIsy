# CSV-Backed Camera Barcode Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace EWG/OBF API lookups with a local CSV file and add camera-based barcode scanning to the web frontend.

**Architecture:** A new `web/csv_loader.py` loads `verify/cosmetics_data.csv` at Flask startup into a dict keyed by barcode. `web/web_server.py` calls the loader instead of the API clients. `web/index.html` adds ZXing-js camera scanning that feeds detected barcodes into the existing fetch-and-render pipeline.

**Tech Stack:** Python 3 / Flask, `csv` stdlib, ZXing-js v0.21 (CDN), Raspberry Pi Bookworm / Chromium

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `web/csv_loader.py` | **Create** | Load CSV at startup, lookup by barcode |
| `tests/test_csv_loader.py` | **Create** | Unit tests for csv_loader |
| `web/web_server.py` | **Modify** | Replace API imports with csv_loader |
| `web/index.html` | **Modify** | Add camera UI and ZXing-js scanning |

---

## Task 1: CSV Loader

**Files:**
- Create: `web/csv_loader.py`
- Create: `tests/test_csv_loader.py`

### Background

The CSV (`verify/cosmetics_data.csv`) has these columns:
`Barcode, Brand, Product Name, EWG Score, Ingredients, Cancer Concern, Allergies & Immunotoxicity, Developmental & Reproductive Toxicity, Use Restrictions, Flagged Ingredients, Yuka Score`

Some products have multiple barcodes in one cell: `"0792850002722, 0792850140998"` — the CSV parser strips the outer quotes, leaving `0792850002722, 0792850140998`. Each barcode gets its own entry in the dict.

The loader must produce a response shape that matches what `renderResults()` in `index.html` expects:
```json
{
  "product": { "name": "...", "brand": "...", "ingredients": ["..."] },
  "scores": {
    "compilation_score": 5,
    "compilation_grade": "Proceed with Glam",
    "compilation_label": "Moderate hazard",
    "yuka_score": "25/100 (moderate)",
    "databases": { "ewg": { "score": 5, "grade": "MODERATE", "source": "csv" } },
    "all_concerns": ["Cancer Concern", "Allergies & Immunotoxicity"],
    "all_flagged_ingredients": [
      { "name": "Ingredient Name", "score": 5, "concerns": ["Cancer Concern"] }
    ]
  },
  "alternatives": { "same_brand": [], "other_brand": [] }
}
```

- [ ] **Step 1: Create `tests/test_csv_loader.py` with failing tests**

```python
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/david/claude
python -m pytest tests/test_csv_loader.py -v 2>&1 | head -30
```

Expected: `ModuleNotFoundError: No module named 'web.csv_loader'`

- [ ] **Step 3: Create `web/csv_loader.py`**

```python
# web/csv_loader.py
"""
Loads cosmetics_data.csv at startup and provides barcode lookup.

Public interface:
    load_csv(path: str) -> dict[str, dict]
    lookup_by_barcode(db: dict, barcode: str) -> dict | None
"""
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
    """
    Parse the Flagged Ingredients CSV column into a list of dicts.

    Input example: "Peppermint Oil (Score 04), Limonene (moderate concern)"
    Splits on ', ' while ignoring commas inside parentheses.
    Strips trailing parenthetical annotations from each name.
    """
    if not raw or not raw.strip():
        return []
    # Split on ", " not inside parentheses
    parts = re.split(r',\s+(?![^(]*\))', raw)
    result = []
    for part in parts:
        # Strip trailing "(Score 04)" style annotation
        name = re.sub(r'\s*\([^)]*\)\s*$', '', part.strip())
        if name:
            result.append({
                "name": name,
                "score": ewg_score,
                "concerns": concerns,
            })
    return result


def load_csv(path: str) -> dict:
    """
    Load the cosmetics CSV into a dict keyed by barcode string.

    Products with multiple barcodes (comma-separated in one cell) get
    one entry per barcode, all pointing to the same record dict.
    """
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
            # Parse barcodes — csv module strips outer quotes already
            raw_barcodes = row.get("Barcode", "")
            barcodes = [b.strip() for b in raw_barcodes.split(",") if b.strip()]

            ewg_score = int(row.get("EWG Score", 0) or 0)

            concerns = [
                col for col in concern_cols
                if row.get(col, "").strip()
            ]

            flagged = _parse_flagged_ingredients(
                row.get("Flagged Ingredients", ""),
                ewg_score,
                concerns,
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
    """Return the product record for the given barcode, or None if not found."""
    return db.get(barcode.strip())
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/david/claude
python -m pytest tests/test_csv_loader.py -v
```

Expected: all 14 tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/david/claude
git add web/csv_loader.py tests/test_csv_loader.py
git commit -m "feat: add csv_loader — load cosmetics CSV and lookup by barcode"
```

---

## Task 2: Update Web Server

**Files:**
- Modify: `web/web_server.py`

Replace the API-based `/scan/<barcode>` and `/product/<barcode>` routes with CSV lookups. The response shape now matches the `renderResults()` shape directly (no intermediate re-shaping needed).

- [ ] **Step 1: Replace `web/web_server.py`**

Replace the entire file with:

```python
"""
Verity™ Web Server
Flask API that serves product data from a local CSV file.

Run on Raspberry Pi:
    python3 web/web_server.py

Endpoints:
    GET  /health              → { "ok": true, "status": "ok", "name": "Verity" }
    GET  /scan/<barcode>      → full product record from CSV
    GET  /product/<barcode>   → raw product info only
"""

import json
import logging
import os
import sys

from flask import Flask, jsonify, send_file
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCANNER_DIR = os.path.join(BASE_DIR, "..")
sys.path.insert(0, SCANNER_DIR)

from web.csv_loader import load_csv, lookup_by_barcode

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
CONFIG_PATH = os.path.join(SCANNER_DIR, "config.json")
try:
    with open(CONFIG_PATH) as f:
        CONFIG = json.load(f)
except FileNotFoundError:
    CONFIG = {}

# ── Load CSV at startup ───────────────────────────────────────────────────────
CSV_PATH = os.path.join(SCANNER_DIR, "verify", "cosmetics_data.csv")
try:
    PRODUCT_DB = load_csv(CSV_PATH)
    logger.info("Loaded %d barcodes from %s", len(PRODUCT_DB), CSV_PATH)
except FileNotFoundError:
    logger.error("CSV not found at %s — product lookups will fail", CSV_PATH)
    PRODUCT_DB = {}

# ── App ───────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:*", "http://127.0.0.1:*", "http://192.168.*"])


def err(message, code=400):
    return jsonify({"ok": False, "error": message}), code


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_file(os.path.join(BASE_DIR, "index.html"))


@app.route("/health")
def health():
    return jsonify({
        "ok": True,
        "status": "ok",
        "name": "Verity™",
        "version": "2.0.0",
        "products_loaded": len(PRODUCT_DB),
    })


@app.route("/scan/<barcode>")
def scan(barcode):
    """Full product record: scores, concerns, flagged ingredients."""
    barcode = barcode.strip()
    if not barcode:
        return err("Barcode is required")

    record = lookup_by_barcode(PRODUCT_DB, barcode)
    if not record:
        return jsonify({"ok": False, "error": "Product not found", "barcode": barcode}), 404

    return jsonify({"ok": True, "barcode": barcode, **record})


@app.route("/product/<barcode>")
def product_info(barcode):
    """Raw product fields only (no scoring)."""
    barcode = barcode.strip()
    if not barcode:
        return err("Barcode is required")

    record = lookup_by_barcode(PRODUCT_DB, barcode)
    if not record:
        return jsonify({"ok": False, "error": "Product not found", "barcode": barcode}), 404

    return jsonify({"ok": True, "product": record["product"]})


@app.route("/config")
def get_config():
    safe = {
        "score_thresholds": CONFIG.get("score_thresholds", {}),
        "display": CONFIG.get("display", {}),
    }
    return jsonify({"ok": True, "config": safe})


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

    parser = argparse.ArgumentParser(description="Verity™ Web Server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", default=5000, type=int)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    print()
    print("  ✨ Verity™ Web Server")
    print(f"  🌸 Listening on http://{args.host}:{args.port}")
    print(f"  📋 Products loaded: {len(PRODUCT_DB)}")
    print()

    app.run(host=args.host, port=args.port, debug=args.debug)
```

- [ ] **Step 2: Smoke-test the server manually**

```bash
cd /Users/david/claude
python web/web_server.py &
sleep 2
curl -s http://localhost:5000/health | python3 -m json.tool
curl -s http://localhost:5000/scan/020714922689 | python3 -m json.tool | head -40
kill %1
```

Expected from `/health`: `"products_loaded"` is greater than 0.
Expected from `/scan/020714922689`: `"ok": true` with `product.name`, `scores.compilation_score`, `scores.all_concerns`.

- [ ] **Step 3: Commit**

```bash
cd /Users/david/claude
git add web/web_server.py
git commit -m "feat: replace API lookups with CSV-backed product database in web server"
```

---

## Task 3: Camera Scanning UI

**Files:**
- Modify: `web/index.html`

Add a live camera view with ZXing-js barcode scanning. When a barcode is detected, the camera stops and the result is fetched and rendered. A "Scan Again" button restarts the camera.

Three changes to `index.html`:
1. Add ZXing-js CDN `<script>` tag in `<head>`
2. Add camera section HTML before the barcode input section
3. Add camera JavaScript (start/stop camera, detect barcode, trigger scan)

Also: update `renderResults` to show the `yuka_score` field and update the database label for `"csv"` source.

- [ ] **Step 1: Add ZXing-js CDN to `<head>`**

In `web/index.html`, find the closing `</head>` tag and add before it:

```html
  <script src="https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js"></script>
```

- [ ] **Step 2: Add camera section HTML**

Find the barcode input section in `index.html`. It contains `id="barcodeInput"`. Add the camera section immediately before the `<input id="barcodeInput"` line:

```html
      <!-- Camera scanner -->
      <div id="cameraSection" class="camera-section glass">
        <div class="camera-wrap">
          <video id="cameraFeed" playsinline autoplay muted></video>
          <div class="camera-overlay">
            <div class="scan-frame"></div>
            <p class="scan-hint">Point camera at product barcode</p>
          </div>
        </div>
        <button class="btn-secondary" onclick="stopCamera()" id="cancelScanBtn">Cancel</button>
      </div>

      <button id="scanAgainBtn" class="btn-primary hidden" onclick="startCamera()">
        📷 Scan Again
      </button>
```

- [ ] **Step 3: Add camera CSS**

Find the `/* ── Utility */` CSS comment block. Add before it:

```css
    /* ── Camera ─────────────────────────────────────────────────── */
    .camera-section {
      width: 100%;
      max-width: 480px;
      margin: 0 auto 24px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .camera-wrap {
      position: relative;
      width: 100%;
      max-width: 360px;
      border-radius: 16px;
      overflow: hidden;
      background: #000;
      aspect-ratio: 4/3;
    }
    #cameraFeed {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .camera-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .scan-frame {
      width: 200px;
      height: 120px;
      border: 2px solid var(--hot-pink);
      border-radius: 12px;
      box-shadow: 0 0 0 2000px rgba(0,0,0,0.35);
    }
    .scan-hint {
      color: rgba(255,255,255,0.9);
      font-size: 0.8rem;
      text-align: center;
      letter-spacing: 0.04em;
      text-shadow: 0 1px 4px rgba(0,0,0,0.6);
    }
```

- [ ] **Step 4: Fix `API_URL` default so camera scans work when served from Flask**

Find in the `<script>` block:
```javascript
  let API_URL = localStorage.getItem('verity_api_url') || '';
```

Replace with:
```javascript
  let API_URL = localStorage.getItem('verity_api_url') || window.location.origin;
```

This means on the Pi — where the page is served by Flask at `http://<pi-ip>:5000` — scan fetches go to the same server automatically with no manual config required.

- [ ] **Step 5: Add camera JavaScript**

In `index.html`, find the `<script>` block. Add the following camera functions immediately after the updated `let API_URL = ...` line:

```javascript
  /* ── Camera scanning ─────────────────────────────────────────── */
  let codeReader = null;
  let cameraActive = false;

  async function startCamera() {
    const section = document.getElementById('cameraSection');
    const againBtn = document.getElementById('scanAgainBtn');
    const results = document.getElementById('results');

    section.classList.remove('hidden');
    againBtn.classList.add('hidden');
    results.classList.add('hidden');
    results.innerHTML = '';

    codeReader = new ZXing.BrowserMultiFormatReader();
    cameraActive = true;

    try {
      const devices = await ZXing.BrowserMultiFormatReader.listVideoInputDevices();
      // Prefer rear camera on Pi (usually the only one, or last in list)
      const deviceId = devices.length > 1
        ? devices[devices.length - 1].deviceId
        : (devices[0] ? devices[0].deviceId : undefined);

      await codeReader.decodeFromVideoDevice(
        deviceId,
        document.getElementById('cameraFeed'),
        (result, err) => {
          if (result && cameraActive) {
            cameraActive = false;
            const barcode = result.getText();
            stopCamera();
            runScanWithBarcode(barcode);
          }
        }
      );
    } catch (e) {
      stopCamera();
      showError();
    }
  }

  function stopCamera() {
    if (codeReader) {
      codeReader.reset();
      codeReader = null;
    }
    cameraActive = false;
    document.getElementById('cameraSection').classList.add('hidden');
  }

  async function runScanWithBarcode(barcode) {
    showLoading();

    try {
      const r = await fetch(`${API_URL}/scan/${barcode}`);
      if (r.status === 404) { showNotFound(barcode); return; }
      if (!r.ok) { showError(); return; }
      const data = await r.json();
      renderResults(data);
    } catch (e) {
      showError();
    } finally {
      document.getElementById('scanAgainBtn').classList.remove('hidden');
    }
  }

  // Start camera automatically when page loads (if API_URL is set)
  window.addEventListener('DOMContentLoaded', () => {
    if (API_URL) startCamera();
  });
```

- [ ] **Step 6: Update `renderResults` to show Yuka Score and fix CSV database label**

In `renderResults`, find:
```javascript
      const dbNames = { ewg: 'EWG Skin Deep', open_beauty_facts: 'Open Beauty Facts' };
```

Replace with:
```javascript
      const dbNames = { ewg: 'EWG Skin Deep', open_beauty_facts: 'Open Beauty Facts', csv: 'EWG (CSV)' };
```

Then find (inside the db card template):
```javascript
          <div class="db-source">${db.source === 'ewg_api' ? '✦ API' : 'ingredient analysis'}</div>
```

Replace with:
```javascript
          <div class="db-source">${db.source === 'csv' ? '✦ local database' : db.source === 'ewg_api' ? '✦ API' : 'ingredient analysis'}</div>
```

Then find the Yuka Score display location — inside the `score-card` section after `compilation_label`, find:
```javascript
          <div class="score-sublabel">${scores.compilation_label} · weighted compilation</div>
```

Replace with:
```javascript
          <div class="score-sublabel">${scores.compilation_label}${scores.yuka_score ? ' · Yuka: ' + scores.yuka_score : ''}</div>
```

- [ ] **Step 7: Update `showNotFound` to show "Scan Again" button**

Find `showNotFound` function and replace:
```javascript
  function showNotFound(barcode) {
    document.getElementById('results').innerHTML = `
      <div class="glass" style="padding:40px;text-align:center">
        <div style="font-size:2.5rem;margin-bottom:16px">🌷</div>
        <h2 style="font-family:'Raleway',sans-serif;color:var(--deep-pink);margin-bottom:8px">
          Product not found</h2>
        <p style="color:var(--muted);font-size:0.9rem">
          No result for barcode <strong>${barcode}</strong>.<br/>
          Try adding it at
          <a href="https://openbeautyfacts.org" target="_blank"
             style="color:var(--hot-pink)">openbeautyfacts.org</a> 💗
        </p>
      </div>`;
  }
```

Replace with:
```javascript
  function showNotFound(barcode) {
    document.getElementById('results').innerHTML = `
      <div class="glass" style="padding:40px;text-align:center">
        <div style="font-size:2.5rem;margin-bottom:16px">🌷</div>
        <h2 style="font-family:'Raleway',sans-serif;color:var(--deep-pink);margin-bottom:8px">
          Product not found</h2>
        <p style="color:var(--muted);font-size:0.9rem">
          No result for barcode <strong>${barcode}</strong>.<br/>
          This product may not be in our database yet. 💗
        </p>
      </div>`;
    document.getElementById('scanAgainBtn').classList.remove('hidden');
  }
```

- [ ] **Step 8: Test the full flow end-to-end**

```bash
cd /Users/david/claude
python web/web_server.py --debug &
```

Open `http://localhost:5000` in a browser. Verify:
- Camera preview appears on load
- Scanning barcode `020714922689` (or typing it in the text input and pressing Enter) returns the Clinique product
- Product name, brand, score ring, concerns, and flagged ingredients are displayed
- Yuka Score appears in the score subtitle
- "Scan Again" button appears after result
- Clicking "Scan Again" restarts the camera

Kill server: `kill %1`

- [ ] **Step 9: Commit**

```bash
cd /Users/david/claude
git add web/index.html
git commit -m "feat: add camera barcode scanning with ZXing-js and Yuka Score display"
```

---

## Task 4: Raspberry Pi Verification

**Files:** None (runtime verification only)

- [ ] **Step 1: Copy project to Pi and install dependencies**

```bash
# On the Pi
pip3 install flask flask-cors
```

Verify `httpx`, `rich`, and other old API dependencies are no longer needed (they're still in `requirements.txt` but the web server no longer imports them).

- [ ] **Step 2: Start the server on the Pi**

```bash
cd /path/to/project
python3 web/web_server.py --host 0.0.0.0 --port 5000
```

Expected output:
```
  ✨ Verity™ Web Server
  🌸 Listening on http://0.0.0.0:5000
  📋 Products loaded: <N>
```

- [ ] **Step 3: Open Chromium on the Pi and verify camera**

Open `http://localhost:5000`. Chromium on Bookworm will prompt for camera permission — allow it. Verify the camera feed appears and scanning works.

- [ ] **Step 4: Update `requirements.txt` to reflect actual dependencies**

Replace the contents of `requirements.txt` with:

```
flask>=3.0.0
flask-cors>=4.0.0
```

```bash
cd /Users/david/claude
git add requirements.txt
git commit -m "chore: update requirements.txt — only flask deps needed for CSV-backed server"
```
