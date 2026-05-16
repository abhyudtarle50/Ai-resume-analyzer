"""
============================================================
AnalysisHistory Model
============================================================
Represents a single completed resume analysis stored in
the SQLite database.

TABLE: analysis_history
COLUMNS:
    id               — Primary key (auto-increment)
    filename         — Original name of the uploaded PDF
    ats_score        — ATS score (0-100) returned by Sarvam AI
    strengths        — JSON list of strength strings
    weaknesses       — JSON list of weakness strings
    suggestions      — JSON list of improvement suggestions
    skills           — JSON list of recommended skills
    roadmap          — Career roadmap text
    upload_date      — Timestamp when the record was created
============================================================
"""

from datetime import datetime, timezone
from database.db import db


class AnalysisHistory(db.Model):
    """SQLAlchemy model for the 'analysis_history' table."""

    __tablename__ = "analysis_history"

    # -----------------------------------------------------------------
    # Columns
    # -----------------------------------------------------------------

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
        doc="Unique ID for each analysis record."
    )

    filename = db.Column(
        db.String(255),
        nullable=False,
        doc="Original filename of the uploaded resume PDF."
    )

    ats_score = db.Column(
        db.Integer,
        nullable=True,
        doc="ATS compatibility score (0–100) produced by Sarvam AI."
    )

    # We store lists as JSON — SQLite supports JSON columns via SQLAlchemy.
    strengths = db.Column(
        db.JSON,
        nullable=True,
        doc="List of key strengths found in the resume."
    )

    weaknesses = db.Column(
        db.JSON,
        nullable=True,
        doc="List of areas for improvement found in the resume."
    )

    suggestions = db.Column(
        db.JSON,
        nullable=True,
        doc="List of actionable improvement suggestions."
    )

    skills = db.Column(
        db.JSON,
        nullable=True,
        doc="List of recommended skills to learn."
    )

    roadmap = db.Column(
        db.Text,
        nullable=True,
        doc="Career roadmap paragraph produced by Sarvam AI."
    )

    rich_data = db.Column(
        db.JSON,
        nullable=True,
        doc="Full rich data from the new AI pipeline."
    )

    upload_date = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        doc="UTC timestamp when this analysis was created."
    )

    # -----------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------

    def __repr__(self):
        """Developer-friendly string for debugging."""
        return (
            f"<AnalysisHistory id={self.id} "
            f"file='{self.filename}' ats={self.ats_score}>"
        )

    def to_dict(self):
        """
        Convert the model instance to a plain dictionary.
        This is what gets serialised and sent as JSON to the frontend.
        """
        return {
            "id": self.id,
            "filename": self.filename,
            "ats_score": self.ats_score,
            "strengths": self.strengths or [],
            "weaknesses": self.weaknesses or [],
            "suggestions": self.suggestions or [],
            "skills": self.skills or [],
            "roadmap": self.roadmap or "",
            "rich_data": self.rich_data or {},
            "upload_date": (
                self.upload_date.isoformat() if self.upload_date else None
            ),
        }
