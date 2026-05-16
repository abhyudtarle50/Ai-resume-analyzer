"""
============================================================
Application Factory
============================================================
This is the heart of the Flask application.  The "factory
pattern" means we create the app inside a function rather
than at module level.  This gives us:

  1. Multiple configurations (dev / prod / test)
  2. Easier testing (create a fresh app per test)
  3. No circular-import issues

HOW IT WORKS
------------
1. create_app() is called from run.py (or a test suite).
2. It builds a Flask instance, loads config, initialises
   extensions (SQLAlchemy, CORS), and registers Blueprints.
3. It returns the fully-configured app object.
============================================================
"""

import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from config.settings import config_by_name
from database.db import db


def create_app(config_name: str = None) -> Flask:
    """
    Build and return a configured Flask application.

    Parameters
    ----------
    config_name : str, optional
        One of 'development', 'production', or 'testing'.
        Defaults to the FLASK_ENV environment variable,
        falling back to 'development'.

    Returns
    -------
    Flask
        The fully-configured application instance.
    """

    # --- Determine which config to use --------------------------
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    # --- Create the Flask app -----------------------------------
    app = Flask(
        __name__,
        instance_relative_config=False,
    )

    # --- Load configuration -------------------------------------
    app.config.from_object(config_by_name[config_name])

    # --- Ensure critical folders exist --------------------------
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(
        os.path.join(app.config.get("BASEDIR", "."), "database"),
        exist_ok=True,
    )

    # --- Initialise extensions ----------------------------------
    db.init_app(app)          # SQLAlchemy (database ORM)
    
    # Allow cross-origin requests from React
    # In production, this uses CORS_ORIGINS from settings.py
    CORS(app, resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})

    # --- Register Blueprints ------------------------------------
    from routes.main_routes import main_bp
    from routes.resume_routes import resume_bp
    from routes.analysis import analysis_bp
    from routes.history import history_bp
    from routes.resources import resources_bp

    app.register_blueprint(main_bp, url_prefix="/api")
    app.register_blueprint(resume_bp, url_prefix="/api")
    app.register_blueprint(analysis_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")
    app.register_blueprint(resources_bp, url_prefix="/api")



    # --- Create database tables ---------------------------------
    # `create_all()` is safe to call repeatedly — it only
    # creates tables that don't already exist.
    with app.app_context():
        import models  # noqa: F401  — registers models with SQLAlchemy
        db.create_all()
        app.logger.info("Database tables created / verified.")

    # --- Global error handlers ----------------------------------
    _register_error_handlers(app)


    # --- Serve React build for SPA routing in production ---
    REACT_BUILD_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        """Serve React app and fallback to index.html for SPA routing"""
        # Only handle non-API routes
        if path.startswith('api/'):
            return ("Not Found", 404)
        file_path = os.path.join(REACT_BUILD_PATH, path)
        if os.path.isfile(file_path):
            return send_from_directory(REACT_BUILD_PATH, path)
        return send_from_directory(REACT_BUILD_PATH, 'index.html')

    app.logger.info(
        f"App created successfully  [config={config_name}]"
    )

    return app


# ================================================================
# Error Handlers
# ================================================================
def _register_error_handlers(app: Flask):
    """Attach JSON error handlers so the API never returns HTML."""

    from flask import jsonify

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "status": "error",
            "message": "The requested resource was not found.",
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "status": "error",
            "message": "HTTP method not allowed for this endpoint.",
        }), 405

    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({
            "status": "error",
            "message": "File too large. Maximum upload size is 16 MB.",
        }), 413

    @app.errorhandler(500)
    def internal_error(error):
        import traceback
        app.logger.error(f"Internal Server Error: {str(error)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": "An unexpected internal server error occurred.",
            "detail": str(error) if app.debug else None
        }), 500
