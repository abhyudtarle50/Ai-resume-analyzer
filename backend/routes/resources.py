"""
============================================================
Resources Route  —  GET /resources
============================================================
Returns YouTube tutorial videos for a list of skills that
the caller passes as a query-string parameter.

USAGE EXAMPLES
--------------
# Single skill
GET /resources?skills=Docker

# Multiple skills (comma-separated)
GET /resources?skills=Docker,AWS,React

# Skills from a saved analysis record
GET /resources?record_id=3

The route supports both patterns so the frontend can either
pass skills directly or look them up from a DB record.
============================================================
"""

from flask import Blueprint, request, jsonify
from utils.youtube_helper import fetch_videos_for_skills
from models.analysis_history import AnalysisHistory

# ----------------------------------------------------------
# Blueprint  (flat URL — no prefix)
# ----------------------------------------------------------
resources_bp = Blueprint("resources", __name__)


@resources_bp.route("/resources", methods=["GET"])
def get_resources():
    """
    GET /resources

    Query parameters (use ONE of the two options):

    Option A — pass skills directly:
        ?skills=Docker,AWS,React

    Option B — pass a saved record ID so we read
               its recommended skills from the DB:
        ?record_id=3

    Success response (200):
        {
            "status": "success",
            "count": 3,
            "videos": [
                {
                    "skill": "Docker",
                    "title": "Docker Tutorial for Beginners",
                    "thumbnail": "https://i.ytimg.com/...",
                    "video_url": "https://www.youtube.com/watch?v=...",
                    "channel": "TechWorld with Nana"
                },
                ...
            ]
        }

    Error responses:
        400  — no skills provided / empty list
        404  — record_id not found in DB
        500  — YouTube API failure
    """

    skills = []

    # ----------------------------------------------------------
    # 1. Resolve skills from query params
    # ----------------------------------------------------------
    record_id = request.args.get("record_id")
    skills_param = request.args.get("skills")

    if record_id:
        # Option B: look up the analysis record and use its skills list
        try:
            record_id = int(record_id)
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "record_id must be an integer.",
            }), 400

        record = AnalysisHistory.query.get(record_id)

        if record is None:
            return jsonify({
                "status": "error",
                "message": f"No analysis record found with ID {record_id}.",
            }), 404

        skills = record.skills or []

    elif skills_param:
        # Option A: parse the comma-separated string
        skills = [s.strip() for s in skills_param.split(",") if s.strip()]

    # Guard: nothing to search for
    if not skills:
        return jsonify({
            "status": "error",
            "message": (
                "No skills provided. Use ?skills=Docker,AWS "
                "or ?record_id=<id> to fetch resources."
            ),
        }), 400

    # ----------------------------------------------------------
    # 2. Fetch videos from YouTube
    # ----------------------------------------------------------
    try:
        videos = fetch_videos_for_skills(skills)
    except ValueError as ve:
        # Missing API key — config error
        return jsonify({
            "status": "error",
            "message": str(ve),
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to fetch YouTube resources.",
            "detail": str(e),
        }), 500

    # ----------------------------------------------------------
    # 3. Return the video list
    # ----------------------------------------------------------
    return jsonify({
        "status": "success",
        "count": len(videos),
        "videos": videos,
    }), 200
