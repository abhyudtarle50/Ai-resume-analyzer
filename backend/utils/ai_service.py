"""
============================================================
Sarvam AI Service  —  utils/ai_service.py
============================================================
Lazy-loaded Sarvam AI wrapper. The client is NOT created
until the first actual API call, avoiding wasted
initialization on every Flask restart.

Uses the SAME function as sarvam_helper.py to avoid having
two separate AI services making duplicate calls.
============================================================
"""

from utils.sarvam_helper import get_sarvam_response


class SarvamService:
    """Thin wrapper that delegates to get_sarvam_response."""

    def analyze_resume(self, resume_text: str) -> dict:
        """
        Analyze resume text using Sarvam AI API.
        Delegates to the shared get_sarvam_response function.
        """
        if not resume_text or len(resume_text.strip()) < 50:
            raise ValueError("Resume text is too short or empty for analysis.")
        return get_sarvam_response(resume_text)


# Singleton — but NO Sarvam initialization happens here.
# The client is only created when analyze_resume() is actually called.
sarvam_service = SarvamService()
