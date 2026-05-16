"""
============================================================
History Routes  —  GET /history  |  DELETE /history/<id>
============================================================
Provides two endpoints for managing resume analysis records
stored in the SQLite database:

  GET  /history         → Return all past analyses (newest first)
  DELETE /history/<id>  → Delete a single record by its ID
============================================================
"""

from flask import Blueprint, jsonify
from database.db import db
from models.analysis_history import AnalysisHistory

# ----------------------------------------------------------
# Blueprint
# ----------------------------------------------------------
history_bp = Blueprint("history", __name__)


# ==========================================================
# GET /history
# ==========================================================
@history_bp.route("/history", methods=["GET"])
def get_history():
    """
    GET /history

    Returns all resume analysis records, sorted from newest
    to oldest.

    Response (200):
        {
            "status": "success",
            "count": 5,
            "history": [
                {
                    "id": 5,
                    "filename": "john_doe.pdf",
                    "ats_score": 82,
                    "strengths": [...],
                    "weaknesses": [...],
                    "suggestions": [...],
                    "skills": [...],
                    "roadmap": "...",
                    "upload_date": "2026-05-08T07:40:00"
                },
                ...
            ]
        }
    """
    try:
        # Query all records, newest first
        records = (
            AnalysisHistory.query
            .order_by(AnalysisHistory.upload_date.desc())
            .all()
        )

        return jsonify({
            "status": "success",
            "count": len(records),
            "history": [r.to_dict() for r in records],
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve history.",
            "detail": str(e),
        }), 500


# ==========================================================
# DELETE /history/<id>
# ==========================================================
@history_bp.route("/history/<int:record_id>", methods=["DELETE"])
def delete_history(record_id: int):
    """
    DELETE /history/<id>

    Deletes the analysis record with the given ID.

    Response (200):
        { "status": "success", "message": "Record 3 deleted." }

    Response (404):
        { "status": "error", "message": "Record not found." }
    """
    try:
        # Look up the record
        record = db.session.get(AnalysisHistory, record_id)

        if record is None:
            return jsonify({
                "status": "error",
                "message": f"No analysis record found with ID {record_id}.",
            }), 404

        # Delete and commit
        db.session.delete(record)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"Record {record_id} deleted successfully.",
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Failed to delete the record.",
            "detail": str(e),
        }), 500
