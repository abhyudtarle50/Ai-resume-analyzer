"""
============================================================
AI Pipeline Tasks  —  utils/ai_pipeline/tasks.py
============================================================
Implementation of individual tasks in the AI chain.
Each function calls Sarvam AI with a specific prompt, schema,
and temperature setting.
============================================================
"""

import json
import re
import time
from utils.sarvam_helper import _get_client, SARVAM_MODEL
from utils.ai_pipeline.schemas import (
    PROFILE_SCHEMA, ATS_SCHEMA, STRENGTHS_SCHEMA,
    GAPS_SCHEMA, SKILLS_SCHEMA, ROADMAP_SCHEMA,
    ROLE_MATCHING_SCHEMA, LEARNING_RESOURCES_SCHEMA,
    MENTOR_INSIGHT_SCHEMA
)
from utils.ai_pipeline.prompts import (
    PROMPT_PROFILE_EXTRACTION, PROMPT_ATS_SCORING, PROMPT_STRENGTHS,
    PROMPT_GAPS_AND_ACTIONS, PROMPT_SKILL_DETECTION, PROMPT_CAREER_ROADMAP,
    PROMPT_ROLE_MATCHING, PROMPT_LEARNING_RESOURCES,
    PROMPT_MENTOR_INSIGHT
)


def _extract_json(text: str) -> dict:
    """
    Extract JSON from a text response that may contain
    markdown code blocks or surrounding text.
    """
    text = text.strip()

    # Try to extract from markdown code blocks
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    # Try to find raw JSON object
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return json.loads(text[start:end + 1])

    # Last resort: try parsing the whole thing
    return json.loads(text)


def _execute_task(prompt_template: str, schema: dict, temperature: float, **kwargs) -> dict:
    """
    Core helper to execute a Sarvam AI task with structured output.
    
    Parameters:
    - prompt_template: The string template from prompts.py
    - schema: The JSON schema dict from schemas.py (embedded in system prompt)
    - temperature: Controls randomness (0.0 = deterministic)
    - kwargs: Variables to format into the prompt template
    """
    client = _get_client()
    prompt = prompt_template.format(**kwargs)
    
    # System prompt enforcing JSON output with the specific schema
    system_prompt = f"""You are a precise AI assistant for resume analysis.
You MUST respond with ONLY a valid JSON object. No text, explanations, or markdown before or after the JSON.

The JSON MUST conform exactly to this schema:
{json.dumps(schema, indent=2)}

Rules:
- Return ONLY the JSON object
- All required fields must be present
- Use the exact types specified (string, integer, array, object)
- Do not wrap in markdown code blocks"""

    max_retries = 4
    base_delay = 5
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions(
                model=SARVAM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
            )
            
            text = response.choices[0].message.content.strip()
            
            # Parse JSON from the response
            return _extract_json(text)
            
        except json.JSONDecodeError as e:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"[Task Error] JSON parse failed. Retrying in {delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(delay)
            else:
                print(f"[Task Error] Failed to parse JSON after {max_retries} attempts")
                print(f"Raw response: {text[:200]}...")
                raise e
                
        except Exception as e:
            error_str = str(e)
            if ("429" in error_str or "rate" in error_str.lower() or "quota" in error_str.lower()) and attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"[Task Error] Rate Limit hit. Retrying in {delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(delay)
            else:
                print(f"[Task Error] Failed to execute task with prompt: {prompt[:50]}...")
                print(f"Error: {e}")
                raise e


# ----------------------------------------------------------
# Task Functions
# ----------------------------------------------------------

def task_extract_profile(resume_text: str) -> dict:
    """Task 1: Extract structured profile from raw resume text."""
    return _execute_task(
        PROMPT_PROFILE_EXTRACTION,
        PROFILE_SCHEMA,
        temperature=0.0,  # Pure extraction
        resume_text=resume_text
    )

def task_score_ats(profile: dict) -> dict:
    """Task 2: Calculate ATS score based on profile."""
    raw_ats = _execute_task(
        PROMPT_ATS_SCORING,
        ATS_SCHEMA,
        temperature=0.0,  # Deterministic scoring
        profile=json.dumps(profile, indent=2)
    )
    
    # Calculate weighted final score
    weights = {
        "formatting": 0.05,
        "keyword_match": 0.30,
        "project_quality": 0.15,
        "technical_depth": 0.20,
        "experience": 0.10,
        "readability": 0.10,
        "role_relevance": 0.10
    }
    
    final_score = 0
    scoring_factors = []
    
    # Map the JSON schema keys to human readable factors
    factor_names = {
        "formatting": "Formatting",
        "keyword_match": "Keyword Alignment",
        "project_quality": "Project Quality",
        "technical_depth": "Technical Depth",
        "experience": "Experience",
        "readability": "Readability",
        "role_relevance": "Role Relevance"
    }
    
    for key, weight in weights.items():
        data = raw_ats.get(key, {"score": 0, "evidence": "Failed to parse", "improvement": ""})
        sub_score = data.get("score", 0)
        final_score += sub_score * weight
        
        # Convert into the UI expected format
        impact = "strong" if sub_score >= 80 else "moderate" if sub_score >= 50 else "weak"
        
        scoring_factors.append({
            "factor": factor_names.get(key, key),
            "score": impact,
            "detail": data.get("evidence", "No evidence provided.") + (" " + data.get("improvement", "") if data.get("improvement") else "")
        })
        
    return {
        "ats_score": round(final_score),
        "scoring_factors": scoring_factors,
        "_raw_breakdown": raw_ats
    }

def task_analyze_strengths(profile: dict) -> dict:
    """Task 3: Identify strengths with evidence."""
    return _execute_task(
        PROMPT_STRENGTHS,
        STRENGTHS_SCHEMA,
        temperature=0.3,  # Slight creativity allowed
        profile=json.dumps(profile, indent=2)
    )

def task_identify_gaps(profile: dict) -> dict:
    """Task 4: Identify gaps and actions."""
    return _execute_task(
        PROMPT_GAPS_AND_ACTIONS,
        GAPS_SCHEMA,
        temperature=0.3,
        profile=json.dumps(profile, indent=2)
    )

def task_detect_skills(profile: dict) -> dict:
    """Task 5: Classify skills and suggest missing ones."""
    return _execute_task(
        PROMPT_SKILL_DETECTION,
        SKILLS_SCHEMA,
        temperature=0.0,  # Deterministic classification
        profile=json.dumps(profile, indent=2)
    )

def task_generate_roadmap(input_data: dict) -> dict:
    """Task 6: Generate career roadmap timeline."""
    return _execute_task(
        PROMPT_CAREER_ROADMAP,
        ROADMAP_SCHEMA,
        temperature=0.4,  # Needs synthesis and advice
        input_data=json.dumps(input_data, indent=2)
    )

def task_role_match(profile: dict) -> dict:
    """Task 7: Match profile to industry roles."""
    return _execute_task(
        PROMPT_ROLE_MATCHING,
        ROLE_MATCHING_SCHEMA,
        temperature=0.1,
        profile=json.dumps(profile, indent=2)
    )

def task_learning_resources(input_data: dict) -> dict:
    """Task 8: Generate learning resource search queries."""
    return _execute_task(
        PROMPT_LEARNING_RESOURCES,
        LEARNING_RESOURCES_SCHEMA,
        temperature=0.2,
        input_data=json.dumps(input_data, indent=2)
    )

def task_mentor_insight(input_data: dict) -> dict:
    """Task 9: Generate personalized executive summary and next best action."""
    return _execute_task(
        PROMPT_MENTOR_INSIGHT,
        MENTOR_INSIGHT_SCHEMA,
        temperature=0.3,
        input_data=json.dumps(input_data, indent=2)
    )
