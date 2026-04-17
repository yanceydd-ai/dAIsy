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
