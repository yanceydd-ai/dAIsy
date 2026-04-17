"""Synchronous alternatives finder for Flask routes.

Returns safer product alternatives based on brand and score.
Full async implementation lives in Scanner._find_alternatives() in scorer.py.
"""


def find_alternatives(product: dict, score_result: dict) -> dict:
    """
    Return safer alternatives for the scanned product.

    Args:
        product:      dict with keys: name, brand, category, ingredients
        score_result: dict returned by score_product()

    Returns:
        { "same_brand": [...], "other_brand": [...] }
    """
    # Stub — returns empty until EWG index wiring is added.
    # The UI handles empty alternatives gracefully.
    return {"same_brand": [], "other_brand": []}
