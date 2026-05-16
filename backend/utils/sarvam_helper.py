"""
============================================================
Sarvam AI Helper  —  utils/sarvam_helper.py
============================================================
Single source of truth for all Sarvam AI API calls.

MODEL: sarvam-105b
  - Flagship model for complex reasoning
  - Best at following structured JSON instructions

OPTIMIZATIONS
  - Lazy client init (zero API calls at startup)
  - In-memory cache (same resume = zero API calls)
  - JSON extraction with fallback parsing
============================================================
"""

import os
import re
import json
import hashlib
import time
from sarvamai import SarvamAI
from dotenv import load_dotenv

load_dotenv()

_cache = {}
_client = None
SARVAM_MODEL = "sarvam-105b"


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("SARVAM_API_KEY")
        if not api_key:
            raise ValueError("SARVAM_API_KEY not found in .env file")
        _client = SarvamAI(api_subscription_key=api_key)
    return _client


def _hash_text(text: str) -> str:
    return hashlib.md5(text.strip().encode()).hexdigest()


import json_repair

def _extract_json(text: str) -> dict:
    text = text.strip()
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    
    json_string = text
    if match:
        json_string = match.group(1)
    else:
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            json_string = text[start:end + 1]

    try:
        # json_repair will automatically fix missing commas, unescaped quotes, etc.
        parsed = json_repair.loads(json_string)
        if isinstance(parsed, dict):
            return parsed
        else:
            raise ValueError("Parsed JSON is not a dictionary")
    except Exception as e:
        print(f"[JSON ERROR] Failed to parse even with json_repair: {e}")
        print(f"RAW TEXT:\n{text}\n")
        raise e


def _optimize_resume_text(text: str) -> str:
    """Trim extremely long texts and remove duplicate spaces/newlines to save tokens."""
    # Remove multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text)
    # Limit to roughly ~3000 words to prevent token exhaustion on huge documents
    words = text.split()
    if len(words) > 3000:
        words = words[:3000]
    return " ".join(words)


def get_sarvam_response(resume_text: str) -> dict:
    """
    Unified AI call: Analyzes resume text with ONE Sarvam AI request.
    Uses cache to avoid duplicate API calls for the same resume.
    """
    optimized_text = _optimize_resume_text(resume_text)
    text_hash = _hash_text(optimized_text)
    if text_hash in _cache:
        print(f"[CACHE HIT] Returning cached result ({text_hash[:8]})")
        return _cache[text_hash]

    client = _get_client()

    system_prompt = """You are a world-class AI Career Mentor. Analyze the resume and return a STRICT JSON object.

CRITICAL: ALL sections must be INTERCONNECTED. Follow this reasoning chain:
1. Identify the candidate's EXISTING skills from the resume.
2. Identify 3 MISSING skills that are critical for their target role.
3. Weaknesses must explain WHY those missing skills matter.
4. Improvements must be actionable steps to fix those weaknesses.
5. Easy projects must use EXISTING skills (confidence builders).
6. Hard projects must teach MISSING skills (growth challenges).
7. The roadmap must be a logical path: existing skills -> missing skills -> career goal.
8. Everything connects. Nothing random.

RULES:
- Do NOT use double quotes inside any string values. Use single quotes instead.
- Keep bullet points concise (under 12 words).
- Be specific to the candidate. No generic advice.
- No placeholder text like '...' or 'Short sentence'.
- For the "summary" field, MUST be a detailed, multi-paragraph assessment (at least 60-80 words). It should:
    1. Start with a warm greeting using their name if found (e.g., "Hello Rahul!").
    2. Provide a thoughtful evaluation of their current professional standing and technical foundation.
    3. Explicitly explain the 'Industry Gap' — what specific high-level skills they are missing and WHY those are roadblocks for their target role.
    4. End with a motivating 'Mentor's Vision' for their career growth.

JSON SCHEMA (follow EXACTLY):
{
  "ats_score": 72,
  "score_breakdown": {"formatting": 75, "keywords": 70, "projects": 65, "experience": 80, "readability": 75},
  "summary": "Hello! Your Python and Flask background is a fantastic foundation. To stand out for senior roles, you will need to learn Docker, AWS, and CI/CD.",
  "strengths": ["3 years Python backend experience", "REST API design proficiency", "Strong CS fundamentals from B.Tech"],
  "weaknesses": ["No cloud deployment experience limits job options", "Missing containerization skills (Docker)", "No CI/CD pipeline knowledge"],
  "improvements": ["Deploy one project to AWS or GCP", "Dockerize your Flask apps", "Add GitHub Actions CI/CD to a repo"],
  "skills_to_learn": [
    {"skill": "Docker", "reason": "Required for all modern backend roles", "priority": "High"},
    {"skill": "AWS", "reason": "Most demanded cloud platform", "priority": "High"},
    {"skill": "CI/CD", "reason": "Expected in professional teams", "priority": "Medium"}
  ],
  "easy_projects": [
    {
      "title": "REST API with Flask + SQLAlchemy",
      "description": "Build a CRUD API using your existing Flask skills with proper database models",
      "technologies": ["Python", "Flask", "SQLAlchemy", "SQLite"],
      "why_it_helps": "Strengthens your existing backend skills for portfolio",
      "estimated_time": "1 week",
      "difficulty": "Easy"
    }
  ],
  "hard_projects": [
    {
      "title": "Dockerized Microservice on AWS",
      "description": "Containerize a Flask app and deploy it to AWS ECS with CI/CD pipeline",
      "technologies": ["Docker", "AWS ECS", "GitHub Actions", "Flask"],
      "why_it_helps": "Directly addresses your 3 missing skills in one project",
      "estimated_time": "3 weeks",
      "difficulty": "Hard"
    }
  ],
  "roadmap": [
    {"step": 1, "title": "Dockerize Existing Projects", "description": "Start by containerizing your current Flask apps."},
    {"step": 2, "title": "Learn AWS Fundamentals", "description": "Get AWS Cloud Practitioner certified."},
    {"step": 3, "title": "Build CI/CD Pipeline", "description": "Add GitHub Actions to auto-deploy on push."},
    {"step": 4, "title": "Deploy Portfolio Project", "description": "Ship the Dockerized microservice to AWS ECS."}
  ]
}"""

    user_prompt = f"Analyze this resume and return the strictly formatted JSON:\n\n{optimized_text}"

    try:
        t0 = time.time()
        response = client.chat.completions(
            model=SARVAM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=4096,
        )
        t1 = time.time()
        print(f"[TIMING] AI Response Time: {t1 - t0:.2f} seconds")

        content = response.choices[0].message.content
        if content is None:
            raise ValueError(f"AI Model returned None. Finish reason: {getattr(response.choices[0], 'finish_reason', 'unknown')}")
        
        text = content.strip()
        t2 = time.time()
        result = _extract_json(text)
        t3 = time.time()
        print(f"[TIMING] JSON Parsing Time: {t3 - t2:.3f} seconds")
        print(f"[TIMING] Total Sarvam Time: {t3 - t0:.2f} seconds")

        _cache[text_hash] = result
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        err = str(e).lower()
        if "quota" in err or "429" in err or "rate" in err:
            raise Exception("API quota exceeded. Please wait a few minutes and try again.")
        elif "api_key" in err or "401" in err or "403" in err or "unauthorized" in err:
            raise Exception("Invalid API key. Please check SARVAM_API_KEY in your .env file.")
        elif "timeout" in err or "deadline" in err:
            raise Exception("Request timed out. Please try again.")
        else:
            raise Exception(f"Analysis failed: {str(e)}")
