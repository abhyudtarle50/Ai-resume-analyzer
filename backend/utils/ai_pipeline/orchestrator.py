"""
============================================================
AI Pipeline Orchestrator  —  utils/ai_pipeline/orchestrator.py
============================================================
Ties all tasks together, managing sequential and parallel
execution. Exposes a clean interface for the backend.
============================================================
"""

import time
from utils.ai_pipeline.tasks import (
    task_extract_profile, task_score_ats, task_analyze_strengths,
    task_identify_gaps, task_detect_skills, task_generate_roadmap,
    task_role_match, task_learning_resources, task_mentor_insight
)

# Cooldown between API calls to stay within free-tier rate limits
CALL_DELAY = 4  # seconds between calls


def _run_task_safely(name, func, *args):
    """Run a single task with error handling and a delay afterward."""
    try:
        print(f"[Pipeline]   -> {name}")
        result = func(*args)
        time.sleep(CALL_DELAY)
        return result
    except Exception as e:
        print(f"[Pipeline]   [X] {name} failed: {e}")
        time.sleep(CALL_DELAY)  # Still wait even on failure
        return e


def run_pipeline(resume_text: str) -> dict:
    """
    Sequential pipeline orchestrator.
    Runs all 9 Sarvam AI tasks one at a time with a cooldown delay
    between each call to stay within free-tier rate limits.
    """
    try:
        print("[Pipeline] Starting AI pipeline (sequential mode)...")

        # ----------------------------------------------------------
        # Phase 1: Extract Profile
        # ----------------------------------------------------------
        print("[Pipeline] Phase 1: Extracting profile...")
        profile = _run_task_safely("Extract Profile", task_extract_profile, resume_text)
        if isinstance(profile, Exception):
            return {"status": "error", "message": f"Profile extraction failed: {profile}"}

        # ----------------------------------------------------------
        # Phase 2: Analysis (one at a time)
        # ----------------------------------------------------------
        print("[Pipeline] Phase 2: Running analysis tasks...")
        ats_data = _run_task_safely("ATS Scoring", task_score_ats, profile)
        strengths_data = _run_task_safely("Strengths Analysis", task_analyze_strengths, profile)
        gaps_data = _run_task_safely("Gap Identification", task_identify_gaps, profile)
        skills_data = _run_task_safely("Skill Detection", task_detect_skills, profile)
        role_match_data = _run_task_safely("Role Matching", task_role_match, profile)

        # Apply fallbacks for any failures
        if isinstance(ats_data, Exception):
            ats_data = {"ats_score": 0, "scoring_factors": [], "_error": str(ats_data)}
        if isinstance(strengths_data, Exception):
            strengths_data = {"strengths": [], "_error": str(strengths_data)}
        if isinstance(gaps_data, Exception):
            gaps_data = {"gaps": [], "_error": str(gaps_data)}
        if isinstance(skills_data, Exception):
            skills_data = {"current_skills": [], "missing_skills": [], "_error": str(skills_data)}
        if isinstance(role_match_data, Exception):
            role_match_data = {"best_match_role": "Unknown", "match_percentage": 0, "alternative_roles": [], "_error": str(role_match_data)}

        # ----------------------------------------------------------
        # Phase 3: Synthesis (sequential)
        # ----------------------------------------------------------
        print("[Pipeline] Phase 3: Generating roadmap & resources...")
        input_for_roadmap = {
            "profile": profile,
            "ats": ats_data,
            "gaps": gaps_data,
            "skills": skills_data,
            "role_match": role_match_data
        }

        input_for_resources = {
            "missing_skills": skills_data.get("missing_skills", []),
            "gaps": gaps_data.get("gaps", [])
        }

        input_for_mentor = {
            "profile": profile,
            "ats_score": ats_data.get("ats_score", 0),
            "gaps": gaps_data.get("gaps", []),
            "role_match": role_match_data
        }

        roadmap_data = _run_task_safely("Career Roadmap", task_generate_roadmap, input_for_roadmap)
        resources_data = _run_task_safely("Learning Resources", task_learning_resources, input_for_resources)
        mentor_data = _run_task_safely("Mentor Insight", task_mentor_insight, input_for_mentor)

        if isinstance(roadmap_data, Exception):
            roadmap_data = {"roadmap": [], "_error": str(roadmap_data)}
        if isinstance(resources_data, Exception):
            resources_data = {"resources": [], "_error": str(resources_data)}
        if isinstance(mentor_data, Exception):
            mentor_data = {"_error": str(mentor_data)}

        phase2_failed = any(isinstance(v, dict) and "_error" in v for v in [ats_data, strengths_data, gaps_data, skills_data, role_match_data])
        phase3_failed = any(isinstance(v, dict) and "_error" in v for v in [roadmap_data, resources_data, mentor_data])

        # ----------------------------------------------------------
        # Phase 4: Assembly
        # ----------------------------------------------------------
        print("[Pipeline] Pipeline complete.")

        return {
            "status": "success",
            "profile": profile,
            "ats_score": ats_data.get("ats_score", 0),
            "scoring_factors": ats_data.get("scoring_factors", []),
            "strengths": strengths_data.get("strengths", []),
            "gaps": gaps_data.get("gaps", []),
            "skills": skills_data.get("current_skills", []),
            "missing_skills": skills_data.get("missing_skills", []),
            "career_roadmap": roadmap_data.get("roadmap", []),
            "role_match": role_match_data,
            "learning_resources": resources_data.get("resources", []),
            "mentor_insight": mentor_data,
            "_is_partial": phase2_failed or phase3_failed
        }

    except Exception as e:
        print(f"[Pipeline Error] Critical pipeline failure: {e}")
        return {
            "status": "error",
            "message": f"Critical pipeline failure: {str(e)}"
        }
