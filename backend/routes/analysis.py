"""
============================================================
Analysis Route  —  POST /analyze-resume
============================================================
Accepts a PDF upload, extracts text, calls Sarvam AI, saves
the result to SQLite, and returns a JSON response.
============================================================
"""

import os
import tempfile
from flask import Blueprint, request, jsonify

from database.db import db
from models.analysis_history import AnalysisHistory
from utils.pdf_parser import parse_resume_text
from utils.ai_service import sarvam_service

# ----------------------------------------------------------
# Blueprint  (no URL prefix — keep it flat and simple)
# ----------------------------------------------------------
analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/analyze-resume", methods=["POST"])
def analyze_resume():
    """
    POST /analyze-resume

    Expects a multipart/form-data request with one field:
        resume  —  a PDF file

    On success returns (200):
        {
            "status": "success",
            "message": "Resume analyzed successfully",
            "record_id": 3,
            "analysis": { ... }
        }

    On failure returns 400 or 500 with an "error" key.
    """

    # ----------------------------------------------------------
    # 1. Validate the uploaded file
    # ----------------------------------------------------------
    extracted_text = ""
    original_filename = "Pasted Text"
    temp_path = None

    if request.is_json and "resume_text" in request.json:
        extracted_text = request.json["resume_text"]
    elif "resume" in request.files:
        file = request.files["resume"]
        if file.filename == "":
            return jsonify({"error": "No file selected."}), 400
        if not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files are supported."}), 400
        original_filename = file.filename
    else:
        return jsonify({"error": "No resume provided. Send a PDF file or JSON with 'resume_text'."}), 400

    # ----------------------------------------------------------
    # 2. Save to a temp file and extract text (if PDF)
    # ----------------------------------------------------------
    if not extracted_text:
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            tmp.close()
            temp_path = tmp.name
            
            file.save(temp_path)
            extracted_text = parse_resume_text(temp_path)

        except Exception as e:
            return jsonify({"error": f"Failed to read PDF: {str(e)}"}), 500

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    if not extracted_text or len(extracted_text.strip()) < 20:
        return jsonify({"error": "Could not extract readable text from the PDF."}), 400

    # ----------------------------------------------------------
    # 3. Call Sarvam AI for analysis (New AI Pipeline)
    # ----------------------------------------------------------
    try:
        print(f"[ANALYSIS] Starting AI analysis for: {original_filename}")
        analysis = sarvam_service.analyze_resume(extracted_text)
        print(f"[ANALYSIS] AI analysis completed successfully")
        
        if not analysis:
            return jsonify({"error": "Failed to generate analysis (empty response)"}), 500
            
    except Exception as e:
        print(f"[ERROR] AI Analysis failed: {str(e)}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    # ----------------------------------------------------------
    # 4. Return the full response (No database saving anymore)
    # ----------------------------------------------------------
    return jsonify({
        "status": "success",
        "message": "Resume analyzed successfully!",
        "record_id": None,   # Handled by frontend local storage now
        "analysis": analysis,
    }), 200
