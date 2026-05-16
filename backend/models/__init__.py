# ============================================================
# Models Package
# ============================================================
# All SQLAlchemy models live here.
# Each model gets its own file for clarity:
#   - resume.py   → Resume upload records
#   - (future)    → User accounts, analysis history, etc.
#
# Import models here so they are registered with SQLAlchemy
# when the package is imported.
# ============================================================

from models.resume import Resume  # noqa: F401
from models.analysis_history import AnalysisHistory  # noqa: F401
