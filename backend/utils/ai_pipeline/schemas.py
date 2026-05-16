"""
============================================================
AI Pipeline Schemas  —  utils/ai_pipeline/schemas.py
============================================================
JSON schemas for Sarvam AI structured outputs.
These define the expected shape of data returned by each task.
============================================================
"""

# Task 1: Profile Extraction
PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "description": "Candidate's full name if found, else 'Unknown'"},
        "target_role": {"type": "string", "description": "Inferred target role based on experience (e.g., 'Backend Developer')"},
        "experience_level": {
            "type": "string", 
            "enum": ["entry", "mid", "senior"],
            "description": "Overall experience level"
        },
        "domain": {"type": "string", "description": "Engineering domain (e.g., 'Software Engineering', 'Data Science')"},
        "years_experience": {"type": "integer", "description": "Total years of experience detected (0 if entry level)"},
        "current_skills": {
            "type": "array", 
            "items": {"type": "string"},
            "description": "List of technologies and skills found in the resume"
        },
        "education": {"type": "string", "description": "Highest degree or education summary"},
        "key_projects": {
            "type": "array", 
            "items": {"type": "string"},
            "description": "Max 3 key projects mentioned, one line each"
        },
        "resume_word_count": {"type": "integer", "description": "Approximate word count of the input text"}
    },
    "required": ["name", "target_role", "experience_level", "domain", "current_skills"]
}

# Task 2: ATS Scoring
ATS_SCHEMA = {
    "type": "object",
    "properties": {
        "formatting": {"type": "object", "properties": {"score": {"type": "integer"}, "evidence": {"type": "string"}}, "required": ["score", "evidence"]},
        "keyword_match": {"type": "object", "properties": {"score": {"type": "integer"}, "evidence": {"type": "string"}}, "required": ["score", "evidence"]},
        "project_quality": {"type": "object", "properties": {"score": {"type": "integer"}, "evidence": {"type": "string"}}, "required": ["score", "evidence"]},
        "technical_depth": {"type": "object", "properties": {"score": {"type": "integer"}, "evidence": {"type": "string"}}, "required": ["score", "evidence"]},
        "experience": {"type": "object", "properties": {"score": {"type": "integer"}, "evidence": {"type": "string"}}, "required": ["score", "evidence"]},
        "readability": {"type": "object", "properties": {"score": {"type": "integer"}, "evidence": {"type": "string"}}, "required": ["score", "evidence"]},
        "role_relevance": {"type": "object", "properties": {"score": {"type": "integer"}, "evidence": {"type": "string"}}, "required": ["score", "evidence"]}
    },
    "required": ["formatting", "keyword_match", "project_quality", "technical_depth", "experience", "readability", "role_relevance"]
}

# Task 3: Strengths
STRENGTHS_SCHEMA = {
    "type": "object",
    "properties": {
        "strengths": {
            "type": "array",
            "description": "3-5 key strengths grounded in resume evidence",
            "items": {
                "type": "object",
                "properties": {
                    "point": {"type": "string", "description": "The strength claim (e.g., 'Strong Python background')"},
                    "evidence": {"type": "string", "description": "Quote or specific fact from the resume that proves it"}
                },
                "required": ["point", "evidence"]
            }
        }
    },
    "required": ["strengths"]
}

# Task 4: Gaps & Actions
GAPS_SCHEMA = {
    "type": "object",
    "properties": {
        "gaps": {
            "type": "array",
            "description": "3-5 critical gaps with actionable fixes",
            "items": {
                "type": "object",
                "properties": {
                    "gap": {"type": "string", "description": "The identified gap (e.g., 'Missing cloud experience')"},
                    "action": {"type": "string", "description": "Actionable fix (e.g., 'Learn AWS basics and deploy a project')"},
                    "priority": {
                        "type": "string", 
                        "enum": ["critical", "important", "nice_to_have"],
                        "description": "How urgent is this fix"
                    }
                },
                "required": ["gap", "action", "priority"]
            }
        }
    },
    "required": ["gaps"]
}

# Task 5: Skill Detection
SKILLS_SCHEMA = {
    "type": "object",
    "properties": {
        "current_skills": {
            "type": "array",
            "description": "Classified current skills",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Canonical technology name (e.g., 'React')"},
                    "proficiency": {
                        "type": "string", 
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "Inferred proficiency"
                    }
                },
                "required": ["name", "proficiency"]
            }
        },
        "missing_skills": {
            "type": "array",
            "description": "4-5 specific skills to learn next",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Canonical technology name (e.g., 'Docker')"},
                    "relevance": {"type": "string", "description": "Why this skill is needed for the target role"}
                },
                "required": ["name", "relevance"]
            }
        }
    },
    "required": ["current_skills", "missing_skills"]
}

# Task 6: Career Roadmap
ROADMAP_SCHEMA = {
    "type": "object",
    "properties": {
        "roadmap": {
            "type": "array",
            "description": "4-5 structured steps for the career plan",
            "items": {
                "type": "object",
                "properties": {
                    "step": {"type": "integer", "description": "Step number (1, 2, 3...)"},
                    "title": {"type": "string", "description": "Short title of the step"},
                    "description": {"type": "string", "description": "One sentence detail of what to do"},
                    "timeframe": {"type": "string", "description": "Estimated time (e.g., '2-3 weeks')"},
                    "skills_involved": {
                        "type": "array", 
                        "items": {"type": "string"},
                        "description": "Skills from missing_skills targeted here"
                    }
                },
                "required": ["step", "title", "description", "timeframe"]
            }
        }
    },
    "required": ["roadmap"]
}

# Task 7: Role Matching
ROLE_MATCHING_SCHEMA = {
    "type": "object",
    "properties": {
        "best_match_role": {"type": "string", "description": "Standardized job title best suited for candidate"},
        "match_percentage": {"type": "integer", "description": "Match score 0-100"},
        "alternative_roles": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Lateral pivots or alternative titles"
        }
    },
    "required": ["best_match_role", "match_percentage", "alternative_roles"]
}

# Task 8: Learning Resources
LEARNING_RESOURCES_SCHEMA = {
    "type": "object",
    "properties": {
        "resources": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "search_query": {"type": "string", "description": "Highly optimized YouTube search query"},
                    "mentor_reasoning": {"type": "string", "description": "Why this resource is recommended specifically for them"}
                },
                "required": ["search_query", "mentor_reasoning"]
            }
        }
    },
    "required": ["resources"]
}

# Task 9: Mentor Insight
MENTOR_INSIGHT_SCHEMA = {
    "type": "object",
    "properties": {
        "greeting_hook": {"type": "string", "description": "Personalized greeting using candidate's first name"},
        "current_position": {"type": "string"},
        "next_goal": {"type": "string"},
        "industry_readiness": {"type": "string", "description": "Percentage or short phrase"},
        "interview_readiness": {"type": "string", "description": "High/Medium/Low with brief reason"},
        "priority_focus": {"type": "string"},
        "next_best_action": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "description": "One specific, high-impact project or step"},
                "reasoning": {"type": "string", "description": "Why this is the most important thing to do"}
            },
            "required": ["action", "reasoning"]
        }
    },
    "required": ["greeting_hook", "current_position", "next_goal", "industry_readiness", "interview_readiness", "priority_focus", "next_best_action"]
}
