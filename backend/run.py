"""
============================================================
run.py — Application Entry Point
============================================================
Start the Flask development server by running:

    python run.py

This file does three things:
  1. Imports the application factory.
  2. Creates the Flask app.
  3. Starts the development server on http://127.0.0.1:5000

NOTE: In production you would use a WSGI server like
gunicorn instead:
    gunicorn "app:create_app()" --bind 0.0.0.0:8000
============================================================
"""

from app import create_app

# ----------------------------------------------------------
# Create the application using the factory
# ----------------------------------------------------------
app = create_app()

# ----------------------------------------------------------
# Run the development server
# ----------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 55)
    print("  AI Resume Analyzer - Backend Server")
    print("=" * 55)
    print("  URL   : http://127.0.0.1:5000")
    print("  Health: http://127.0.0.1:5000/api/health")
    print("=" * 55 + "\n")

    debug_mode = app.config.get("DEBUG", True)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=debug_mode,
        use_reloader=debug_mode,
    )
