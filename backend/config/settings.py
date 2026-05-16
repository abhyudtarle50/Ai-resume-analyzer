"""
============================================================
Application Configuration
============================================================
Central place for ALL app settings.  Values come from the
.env file (loaded by python-dotenv) so secrets are NEVER
hard-coded in source code.

HOW IT WORKS
------------
1. `python-dotenv` reads your .env file at startup.
2. `os.environ.get(...)` pulls each value into Python.
3. Flask receives these values via `app.config.from_object()`.

ADDING A NEW SETTING
---------------------
1. Add the variable to your .env file.
2. Add a corresponding line below using os.environ.get().
3. Use it in your app via `current_app.config['YOUR_KEY']`.
============================================================
"""

import os
from dotenv import load_dotenv

# ----------------------------------------------------------
# Load .env file from project root
# ----------------------------------------------------------
# `load_dotenv()` searches upward from the current file to
# find the nearest .env file and injects its key-value pairs
# into the process environment.
# ----------------------------------------------------------
load_dotenv()


class Config:
    """
    Base configuration class.
    All environment-dependent settings live here.
    """

    # --- Security -----------------------------------------------------------
    # SECRET_KEY is used by Flask for session signing, CSRF protection, etc.
    # Generate one with:  python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY = os.environ.get("SECRET_KEY", "fallback-dev-key-change-me")

    # --- Database -----------------------------------------------------------
    # We use SQLite for simplicity.  The URI tells SQLAlchemy where to find
    # (or create) the database file.
    #
    # Default path: <project_root>/database/resume_analyzer.db
    BASEDIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASEDIR, 'database', 'resume_analyzer.db')}"
    )
    # Disable the modification-tracking event system (saves memory).
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- File Uploads -------------------------------------------------------
    UPLOAD_FOLDER = os.path.join(BASEDIR, "uploads")
    MAX_CONTENT_LENGTH = int(
        os.environ.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)  # 16 MB
    )
    ALLOWED_EXTENSIONS = {"pdf"}  # Only PDF resumes for now

    # --- Flask Mode ---------------------------------------------------------
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"

    # --- CORS Origins -------------------------------------------------------
    # In production, this should be set to your frontend URL (e.g. https://my-resume-analyzer.vercel.app)
    # comma-separated if multiple origins.
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")


class DevelopmentConfig(Config):
    """Settings specific to local development."""
    DEBUG = True


class ProductionConfig(Config):
    """Settings specific to production deployment."""
    DEBUG = False


class TestingConfig(Config):
    """Settings specific to automated tests."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"  # In-memory DB for tests


# ----------------------------------------------------------
# Quick lookup dict — used by the app factory
# ----------------------------------------------------------
config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
