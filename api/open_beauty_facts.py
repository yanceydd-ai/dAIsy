"""Open Beauty Facts API adapter.

Public REST API, no authentication required.
Documentation: https://wiki.openfoodfacts.org/Open_Beauty_Facts

Barcode lookup: GET /api/v2/product/{barcode}.json
"""

import logging
import re

from .base import BaseAPIClient, RawProductData

logger = logging.getLogger(__name__)

SOURCE_NAME = "Open Beauty Facts"

# Open Beauty Facts uses a "nova_group"-like risk scale in some responses.
# We derive a score from ingredients using the local DB.
OBF_SCORE_MAP = {
    # "ecoscore_grade" or "nutriscore_grade" equivalents for beauty don't exist;
    # we compute a derived score from ingredients.
}


class OpenBeautyFactsClient(BaseAPIClient):
    """Open Beauty Facts API adapter."""

    def __init__(self, config: dict):
        super().__init__(config)
        self.base_url = config.get("base_url", "https://world.openbeautyfacts.org").rstrip("/")

    async def lookup(self, barcode: str) -> RawProductData:
        url = f"{self.base_url}/api/v0/product/{barcode}.json"
        data = await self._get(url)

        if not data:
            return RawProductData(source=SOURCE_NAME, found=False)

        status = data.get("status", 0)
        if status != 1:
            return RawProductData(source=SOURCE_NAME, found=False)

        return self._parse(data)

    def _parse(self, data: dict) -> RawProductData:
        try:
            product = data.get("product", {})

            name = (
                product.get("product_name_en")
                or product.get("product_name")
                or product.get("abbreviated_product_name")
                or "Unknown Product"
            )
            brand = product.get("brands", "").split(",")[0].strip()

            # Parse ingredients from the structured list
            ingredients: list[str] = []
            raw_ingredients = product.get("ingredients") or []
            for ing in raw_ingredients:
                ing_name = ing.get("text") or ing.get("id") or ""
                # Clean up OBF ingredient IDs like "en:water" -> "water"
                if ":" in ing_name:
                    ing_name = ing_name.split(":")[-1]
                ing_name = ing_name.replace("-", " ").strip()
                if ing_name:
                    ingredients.append(ing_name)

            # Fallback: parse ingredients_text if structured list is empty
            if not ingredients:
                ingredients_text = product.get("ingredients_text") or ""
                if ingredients_text:
                    ingredients = _parse_ingredients_text(ingredients_text)

            return RawProductData(
                source=SOURCE_NAME,
                found=True,
                product_name=name,
                brand=brand,
                ingredients=ingredients,
                product_score=None,       # OBF has no native hazard score
                ingredient_scores={},
                score_is_direct=False,    # Score will be derived from ingredients
            )

        except Exception as exc:
            logger.warning("Error parsing Open Beauty Facts response: %s", exc)
            return RawProductData(source=SOURCE_NAME, found=False)


def _parse_ingredients_text(text: str) -> list[str]:
    """Parse a raw ingredients text string into individual ingredient names."""
    # Remove parenthetical notes, strip numbers/percentages
    text = re.sub(r"\([^)]*\)", "", text)
    text = re.sub(r"\d+\.?\d*\s*%", "", text)
    # Split on commas and semicolons
    parts = re.split(r"[,;]", text)
    result = []
    for part in parts:
        part = part.strip().strip(".").strip()
        if part and len(part) > 1:
            result.append(part)
    return result
def lookup_product(barcode: str) -> dict | None:
    """Look up a product by barcode. Checks local EWG DB first, falls back to OBF API."""
    import json
    import os

    # ── 1. Local EWG database ──────────────────────────────────────────────────
    db_path = os.path.expanduser("~/verity/db/ewg_products.json")
    try:
        with open(db_path) as f:
            barcode_index = json.load(f)

        record = barcode_index.get(barcode) or barcode_index.get(barcode.lstrip("0"))

        if record:
            return {
                "name": record.get("name", "Unknown Product"),
                "brand": record.get("brand", ""),
                "category": record.get("category", ""),
                "ingredients": record.get("ingredients", []),
                "ingredient_scores": record.get("ingredient_scores", {}),
                "ewg_score": record.get("score"),
                "ewg_concerns": record.get("ewg_concerns", []),
                "source": "local_ewg",
            }
    except Exception as exc:
        logger.warning("Local EWG DB lookup failed: %s", exc)

    # ── 2. OBF API fallback ────────────────────────────────────────────────────
    import requests

    url = f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("OBF API request failed: %s", exc)
        return None

    if data.get("status") != 1:
        return None

    product = data.get("product", {})
    name = (
        product.get("product_name_en")
        or product.get("product_name")
        or "Unknown Product"
    )
    brand = product.get("brands", "").split(",")[0].strip()

    ingredients: list[str] = []
    for ing in product.get("ingredients") or []:
        ing_name = ing.get("text") or ing.get("id") or ""
        if ":" in ing_name:
            ing_name = ing_name.split(":")[-1]
        ing_name = ing_name.replace("-", " ").strip()
        if ing_name:
            ingredients.append(ing_name)

    if not ingredients:
        ingredients_text = product.get("ingredients_text") or ""
        if ingredients_text:
            ingredients = _parse_ingredients_text(ingredients_text)

    return {
        "name": name,
        "brand": brand,
        "category": product.get("categories", ""),
        "ingredients": ingredients,
        "ingredient_scores": {},
        "ewg_score": None,
        "ewg_concerns": [],
        "source": "obf_api",
    }
