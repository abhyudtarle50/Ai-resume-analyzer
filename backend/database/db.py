"""
============================================================
Database Initialisation Module
============================================================
Creates and exports the single SQLAlchemy instance used
across the entire application.

WHY A SEPARATE MODULE?
-----------------------
Flask-SQLAlchemy requires a single `db` object.  By creating
it here (outside the app factory), we can import it from any
model or route module WITHOUT circular-import issues.

USAGE
-----
    from database.db import db

    class User(db.Model):
        ...
============================================================
"""

from flask_sqlalchemy import SQLAlchemy

# ----------------------------------------------------------
# The global SQLAlchemy instance
# ----------------------------------------------------------
# `db` is uninitialised until we call `db.init_app(app)` in
# the application factory (app/__init__.py).
# ----------------------------------------------------------
db = SQLAlchemy()
