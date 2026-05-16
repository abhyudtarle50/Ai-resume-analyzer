"""
============================================================
Main Routes Blueprint
============================================================
General-purpose endpoints that don't belong to a specific
feature domain.  Think of these as "infrastructure" routes.

ENDPOINTS
---------
GET  /api/health    → Quick health check (is the server alive?)
GET  /api/test      → Simple test route for development

WHY BLUEPRINTS?
---------------
Blueprints let us split routes across multiple files instead
of cramming everything into one giant app.py.  Each Blueprint
is registered with the Flask app in the application factory.
============================================================
"""

from flask import Blueprint, jsonify
from datetime import datetime, timezone

# ----------------------------------------------------------
# Create the Blueprint
# ----------------------------------------------------------
# 'main' is the internal name; url_prefix groups all routes
# under /api so the React frontend can call them easily.
# ----------------------------------------------------------
main_bp = Blueprint("main", __name__)


# ===========================================================
# ROUTE: Health Check
# ===========================================================
@main_bp.route("/health", methods=["GET"])
def health_check():
    """
    GET /api/health

    Returns a simple JSON payload confirming the server is
    running.  Useful for:
      - Docker health checks
      - Load balancer probes
      - Quick manual verification during development

    Response (200):
        {
            "status": "healthy",
            "message": "AI Resume Analyzer API is running!",
            "timestamp": "2026-05-07T21:30:00+00:00"
        }
    """
    return jsonify({
        "status": "healthy",
        "message": "AI Resume Analyzer API is running!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200


# ===========================================================
# ROUTE: Test Endpoint
# ===========================================================
@main_bp.route("/test", methods=["GET"])
def test_route():
    """
    GET /api/test

    A beginner-friendly test route so you can verify
    everything is wired up correctly.

    Response (200):
        {
            "status": "success",
            "message": "Backend is connected and working!",
            "endpoints": { ... }
        }
    """
    return jsonify({
        "status": "success",
        "message": "Backend is connected and working!",
        "project": "AI Resume Analyzer",
        "version": "1.0.0",
        "endpoints": {
            "health_check": "GET /api/health",
            "test": "GET /api/test",
            "upload_resume": "POST /api/resumes/upload  (coming soon)",
            "list_resumes": "GET  /api/resumes          (coming soon)",
        }
    }), 200
