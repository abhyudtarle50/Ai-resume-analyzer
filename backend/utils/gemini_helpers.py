"""
============================================================
Utility Helpers
============================================================
Reusable functions shared across the application.
============================================================
"""

from flask import jsonify


def success_response(message: str, data=None, status_code: int = 200):
    """Build a standardised success JSON response."""
    payload = {"status": "success", "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def error_response(message: str, status_code: int = 400, detail=None):
    """Build a standardised error JSON response."""
    payload = {"status": "error", "message": message}
    if detail is not None:
        payload["detail"] = str(detail)
    return jsonify(payload), status_code
