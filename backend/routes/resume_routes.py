"""
============================================================
Resume Routes Blueprint
============================================================
Handles all resume-related API endpoints:
  - Uploading a resume (PDF)
  - Listing all uploaded resumes
  - Fetching a single resume by ID

These endpoints will later integrate with the AI analysis
engine (Sarvam AI API) and YouTube resource fetcher.

ENDPOINTS
---------
POST /api/resumes/upload   → Upload a new resume
GET  /api/resumes          → List all resumes
GET  /api/resumes/<id>     → Get a specific resume
============================================================
"""

import os
import uuid
from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from database.db import db
from models.resume import Resume
from utils.pdf_parser import parse_resume_text
from utils.ai_service import sarvam_service

# ----------------------------------------------------------
# Create the Blueprint
# ----------------------------------------------------------
resume_bp = Blueprint("resumes", __name__, url_prefix="/api/resumes")


# ===========================================================
# HELPER: Check allowed file extensions
# ===========================================================
def allowed_file(filename: str) -> bool:
    """
    Return True if the filename has an allowed extension.

    We check by splitting on '.' and comparing the extension
    against the set defined in config (currently just 'pdf').
    """
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config.get("ALLOWED_EXTENSIONS", {"pdf"})
    )


# ===========================================================
# ROUTE: Upload Resume
# ===========================================================
@resume_bp.route("/upload", methods=["POST"])
def upload_resume():
    """
    POST /api/resumes/upload

    Accepts a multipart/form-data request with a 'resume' file
    field containing a PDF.

    Success Response (201):
        {
            "status": "success",
            "message": "Resume uploaded successfully!",
            "data": { ... resume dict ... }
        }

    Error Responses:
        400 — No file part / no file selected / invalid type
        500 — Server-side storage or DB error
    """
    # --- Validate the request ----------------------------------------
    if "resume" not in request.files:
        return jsonify({
            "status": "error",
            "message": "No file part in the request. "
                       "Make sure the form field is named 'resume'."
        }), 400

    file = request.files["resume"]

    if file.filename == "" or file.filename is None:
        return jsonify({
            "status": "error",
            "message": "No file was selected for upload."
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "status": "error",
            "message": "Invalid file type. Only PDF files are accepted."
        }), 400

    # --- Save the file -----------------------------------------------
    try:
        # Sanitise the original filename to prevent path traversal attacks
        original_filename = secure_filename(file.filename)

        # Prefix with a UUID to avoid name collisions
        unique_filename = f"{uuid.uuid4().hex}_{original_filename}"

        upload_folder = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)

        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)

        # Get the file size after saving
        file_size = os.path.getsize(filepath)

        # --- Extract text from PDF --------------------------------------
        try:
            extracted_text = parse_resume_text(filepath)
        except Exception as parse_err:
            current_app.logger.warning(f"Text extraction warning: {parse_err}")
            extracted_text = ""

        # --- Create a database record -----------------------------------
        new_resume = Resume(
            filename=original_filename,
            filepath=filepath,
            file_size=file_size,
            extracted_text=extracted_text,
            status="analysed" if extracted_text else "pending",
        )
        db.session.add(new_resume)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Resume uploaded successfully!",
            "data": new_resume.to_dict(),
        }), 201

    except Exception as e:
        # Roll back the transaction so the DB stays clean
        db.session.rollback()
        current_app.logger.error(f"Upload failed: {e}")
        return jsonify({
            "status": "error",
            "message": "An internal error occurred while uploading the resume.",
            "detail": str(e),
        }), 500


# ===========================================================
# ROUTE: List All Resumes
# ===========================================================
@resume_bp.route("", methods=["GET"])
def list_resumes():
    """
    GET /api/resumes

    Returns a JSON array of all uploaded resumes, ordered by
    most recent first.

    Response (200):
        {
            "status": "success",
            "count": 5,
            "data": [ ... ]
        }
    """
    try:
        resumes = Resume.query.order_by(Resume.upload_date.desc()).all()
        return jsonify({
            "status": "success",
            "count": len(resumes),
            "data": [r.to_dict() for r in resumes],
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to list resumes: {e}")
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve resumes.",
            "detail": str(e),
        }), 500


# ===========================================================
# ROUTE: Get Single Resume
# ===========================================================
@resume_bp.route("/<int:resume_id>", methods=["GET"])
def get_resume(resume_id: int):
    """
    GET /api/resumes/<id>

    Returns the details of a single resume by its ID.

    Response (200):  { "status": "success", "data": { ... } }
    Response (404):  { "status": "error", "message": "..." }
    """
    try:
        resume = db.session.get(Resume, resume_id)
        if resume is None:
            return jsonify({
                "status": "error",
                "message": f"Resume with ID {resume_id} not found.",
            }), 404

        return jsonify({
            "status": "success",
            "data": resume.to_dict(),
        }), 200

    except Exception as e:
        current_app.logger.error(f"Failed to get resume {resume_id}: {e}")
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve the resume.",
            "detail": str(e),
        }), 500


# ===========================================================
# ROUTE: Analyze Resume (AI)
# ===========================================================
@resume_bp.route("/<int:resume_id>/analyze", methods=["POST"])
def analyze_resume(resume_id: int):
    """
    POST /api/resumes/<id>/analyze

    Triggers the AI analysis for a specific resume using Sarvam AI.
    """
    try:
        # 1. Fetch the resume from DB
        resume = db.session.get(Resume, resume_id)
        if resume is None:
            return jsonify({
                "status": "error",
                "message": f"Resume with ID {resume_id} not found.",
            }), 404

        # 2. Check if we have extracted text
        if not resume.extracted_text:
            return jsonify({
                "status": "error",
                "message": "No text extracted from this resume. Analysis cannot proceed.",
            }), 400

        # 3. Call Sarvam AI service
        analysis_data = sarvam_service.analyze_resume(resume.extracted_text)

        # 4. Save results to DB
        resume.analysis_result = analysis_data
        resume.status = "analysed"
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "AI analysis completed successfully!",
            "data": resume.analysis_result,
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Analysis failed for resume {resume_id}: {e}")
        return jsonify({
            "status": "error",
            "message": "Failed to analyze the resume.",
            "detail": str(e),
        }), 500
