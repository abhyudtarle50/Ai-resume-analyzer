"""
============================================================
Resume Model
============================================================
Represents a single uploaded resume in the database.

TABLE: resumes
COLUMNS:
    id              — Primary key (auto-incremented integer)
    filename        — Original name of the uploaded file
    filepath        — Server-side path where the file is stored
    file_size       — Size of the file in bytes
    upload_date     — Timestamp of when the file was uploaded
    status          — Processing status (pending / analysed / failed)

RELATIONSHIPS (future):
    - One resume → many analysis results
    - One user   → many resumes
============================================================
"""

from datetime import datetime, timezone
from database.db import db


class Resume(db.Model):
    """SQLAlchemy model for the 'resumes' table."""

    __tablename__ = "resumes"

    # --- Columns ------------------------------------------------------------

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
        doc="Unique identifier for each resume record."
    )

    filename = db.Column(
        db.String(255),
        nullable=False,
        doc="Original filename of the uploaded resume (e.g. 'john_doe_resume.pdf')."
    )

    filepath = db.Column(
        db.String(500),
        nullable=False,
        doc="Server-side path to the stored file (e.g. 'uploads/abc123_resume.pdf')."
    )

    file_size = db.Column(
        db.Integer,
        nullable=True,
        doc="File size in bytes."
    )

    upload_date = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        doc="UTC timestamp when the resume was uploaded."
    )

    status = db.Column(
        db.String(20),
        default="pending",
        nullable=False,
        doc="Processing status: 'pending', 'analysed', or 'failed'."
    )

    extracted_text = db.Column(
        db.Text,
        nullable=True,
        doc="Raw text extracted from the PDF resume."
    )

    analysis_result = db.Column(
        db.JSON,
        nullable=True,
        doc="Structured AI analysis result (JSON)."
    )

    # --- Representation -----------------------------------------------------

    def __repr__(self):
        """Developer-friendly string for debugging."""
        return f"<Resume id={self.id} filename='{self.filename}' status='{self.status}'>"

    def to_dict(self):
        """
        Serialise the model to a plain Python dictionary.
        Useful for returning JSON responses from API routes.
        """
        return {
            "id": self.id,
            "filename": self.filename,
            "filepath": self.filepath,
            "file_size": self.file_size,
            "upload_date": self.upload_date.isoformat() if self.upload_date else None,
            "status": self.status,
            "extracted_text": self.extracted_text,
            "analysis_result": self.analysis_result,
        }
