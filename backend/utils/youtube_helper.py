"""
============================================================
YouTube Helper  —  utils/youtube_helper.py
============================================================
Returns real, playable YouTube videos for each skill.

STRATEGY
--------
1. Normalize Sarvam AI's verbose skill names into clean keys
   (e.g. "Flask or FastAPI (for deployment)" → "fastapi")
2. Match against curated video database of real tutorials
3. Fallback to YouTube API if key is set
4. Final fallback: generate YouTube search link

Each video has: title, thumbnail, video_url, channel name.
============================================================
"""

import os
import re
import urllib.parse
import requests
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# ============================================================
# Curated database of high-quality tutorial videos
# Key = normalized lowercase skill name
# Value = { "id": YouTube video ID, "title": ..., "channel": ... }
# ============================================================
CURATED_VIDEOS = {
    # Programming Languages
    "python": {"id": "rfscVS0vtbw", "title": "Learn Python - Full Course for Beginners", "channel": "freeCodeCamp.org"},
    "javascript": {"id": "PkZNo7MFNFg", "title": "Learn JavaScript - Full Course for Beginners", "channel": "freeCodeCamp.org"},
    "java": {"id": "eIrMbAQSU34", "title": "Java Tutorial for Beginners", "channel": "Programming with Mosh"},
    "c++": {"id": "vLnPwxZdW4Y", "title": "C++ Tutorial for Beginners - Full Course", "channel": "freeCodeCamp.org"},
    "cpp": {"id": "vLnPwxZdW4Y", "title": "C++ Tutorial for Beginners - Full Course", "channel": "freeCodeCamp.org"},
    "c programming": {"id": "KJgsSFOSQv0", "title": "C Programming Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "c#": {"id": "GhQdlMFjVpI", "title": "C# Tutorial - Full Course for Beginners", "channel": "freeCodeCamp.org"},
    "csharp": {"id": "GhQdlMFjVpI", "title": "C# Tutorial - Full Course for Beginners", "channel": "freeCodeCamp.org"},
    "typescript": {"id": "BwuLxPH8IDs", "title": "TypeScript Course for Beginners", "channel": "Academind"},
    "go": {"id": "un6ZyFkqFKo", "title": "Go Programming - Golang Course", "channel": "freeCodeCamp.org"},
    "golang": {"id": "un6ZyFkqFKo", "title": "Go Programming - Golang Course", "channel": "freeCodeCamp.org"},
    "rust": {"id": "BpPEoZW5IiY", "title": "Rust Programming Course for Beginners", "channel": "freeCodeCamp.org"},
    "kotlin": {"id": "F9UC9DY-vIU", "title": "Kotlin Course - Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "swift": {"id": "comQ1-x2a1Q", "title": "Swift Programming Tutorial for Beginners", "channel": "CodeWithChris"},
    "php": {"id": "OK_JCtAJmSY", "title": "PHP For Beginners - Complete Course", "channel": "Traversy Media"},
    "ruby": {"id": "t_ispmWmdjY", "title": "Ruby Programming Language - Full Course", "channel": "freeCodeCamp.org"},
    "r programming": {"id": "_V8eKsto3Ug", "title": "R Programming Tutorial - Learn R", "channel": "freeCodeCamp.org"},
    "scala": {"id": "i9o70PMqMGY", "title": "Scala Tutorial for Beginners", "channel": "ProgrammingKnowledge"},

    # Web Development
    "html": {"id": "kUMe1FH4CHE", "title": "Learn HTML - Full Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "css": {"id": "1Rs2ND1ryYc", "title": "CSS Tutorial - Full Course for Beginners", "channel": "freeCodeCamp.org"},
    "react": {"id": "bMknfKXIFA8", "title": "React Course - Beginner's Tutorial", "channel": "freeCodeCamp.org"},
    "react.js": {"id": "bMknfKXIFA8", "title": "React Course - Beginner's Tutorial", "channel": "freeCodeCamp.org"},
    "reactjs": {"id": "bMknfKXIFA8", "title": "React Course - Beginner's Tutorial", "channel": "freeCodeCamp.org"},
    "angular": {"id": "3qBXWUpoPHo", "title": "Angular Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "vue": {"id": "FXpIoQ_rT_c", "title": "Vue.js Course for Beginners", "channel": "freeCodeCamp.org"},
    "vue.js": {"id": "FXpIoQ_rT_c", "title": "Vue.js Course for Beginners", "channel": "freeCodeCamp.org"},
    "nextjs": {"id": "mTz0GXj8NN0", "title": "Next.js Tutorial for Beginners", "channel": "Traversy Media"},
    "next.js": {"id": "mTz0GXj8NN0", "title": "Next.js Tutorial for Beginners", "channel": "Traversy Media"},
    "nodejs": {"id": "Oe421EPjeBE", "title": "Node.js and Express.js - Full Course", "channel": "freeCodeCamp.org"},
    "node.js": {"id": "Oe421EPjeBE", "title": "Node.js and Express.js - Full Course", "channel": "freeCodeCamp.org"},
    "node": {"id": "Oe421EPjeBE", "title": "Node.js and Express.js - Full Course", "channel": "freeCodeCamp.org"},
    "express": {"id": "Oe421EPjeBE", "title": "Node.js and Express.js - Full Course", "channel": "freeCodeCamp.org"},
    "express.js": {"id": "Oe421EPjeBE", "title": "Node.js and Express.js - Full Course", "channel": "freeCodeCamp.org"},
    "tailwind": {"id": "dFgzHOX84xQ", "title": "Tailwind CSS Full Course", "channel": "freeCodeCamp.org"},
    "bootstrap": {"id": "-qfEOE4vtxE", "title": "Bootstrap CSS Framework - Full Course", "channel": "freeCodeCamp.org"},
    "svelte": {"id": "rv3Yq-B8qp4", "title": "Svelte Tutorial for Beginners", "channel": "Traversy Media"},

    # Backend & APIs
    "django": {"id": "F5mRW0jo-U4", "title": "Python Django Tutorial for Beginners", "channel": "Programming with Mosh"},
    "flask": {"id": "Z1RJmh_OqeA", "title": "Flask Course - Python Web Application Development", "channel": "freeCodeCamp.org"},
    "fastapi": {"id": "7t2alSnE2-I", "title": "Python API Development with FastAPI", "channel": "freeCodeCamp.org"},
    "spring boot": {"id": "9SGDpanrc8U", "title": "Spring Boot Tutorial for Beginners", "channel": "Amigoscode"},
    "spring": {"id": "9SGDpanrc8U", "title": "Spring Boot Tutorial for Beginners", "channel": "Amigoscode"},
    "rest api": {"id": "lsMQRaeKNDk", "title": "REST API Design Best Practices", "channel": "freeCodeCamp.org"},
    "graphql": {"id": "ed8SzALpx1Q", "title": "GraphQL Full Course - Novice to Expert", "channel": "freeCodeCamp.org"},

    # Databases
    "sql": {"id": "HXV3zeQKqGY", "title": "SQL Tutorial - Full Database Course", "channel": "freeCodeCamp.org"},
    "mysql": {"id": "HXV3zeQKqGY", "title": "SQL Tutorial - Full Database Course", "channel": "freeCodeCamp.org"},
    "postgresql": {"id": "qw--VYLpSFk", "title": "Learn PostgreSQL Tutorial - Full Course", "channel": "freeCodeCamp.org"},
    "postgres": {"id": "qw--VYLpSFk", "title": "Learn PostgreSQL Tutorial - Full Course", "channel": "freeCodeCamp.org"},
    "mongodb": {"id": "ExcRbA7fy_A", "title": "MongoDB Crash Course", "channel": "Traversy Media"},
    "redis": {"id": "jgpVdJB2sKQ", "title": "Redis Crash Course", "channel": "Traversy Media"},
    "sqlite": {"id": "HXV3zeQKqGY", "title": "SQL Tutorial - Full Database Course", "channel": "freeCodeCamp.org"},

    # DevOps & Cloud
    "docker": {"id": "fqMOX6JJhGo", "title": "Docker Tutorial for Beginners", "channel": "TechWorld with Nana"},
    "kubernetes": {"id": "X48VuDVv0do", "title": "Kubernetes Tutorial for Beginners", "channel": "TechWorld with Nana"},
    "k8s": {"id": "X48VuDVv0do", "title": "Kubernetes Tutorial for Beginners", "channel": "TechWorld with Nana"},
    "aws": {"id": "k1RI5locZE4", "title": "AWS Full Course - Learn AWS in 10 Hours", "channel": "Edureka"},
    "sagemaker": {"id": "k1RI5locZE4", "title": "AWS Full Course - Learn AWS in 10 Hours", "channel": "Edureka"},
    "azure": {"id": "NKEFWyqJ5XA", "title": "Azure Full Course - Learn Microsoft Azure", "channel": "Edureka"},
    "gcp": {"id": "jpno8FSqpc8", "title": "Google Cloud Platform Full Course", "channel": "Edureka"},
    "google cloud": {"id": "jpno8FSqpc8", "title": "Google Cloud Platform Full Course", "channel": "Edureka"},
    "linux": {"id": "sWbUDq4S6Y8", "title": "Linux for Beginners - Full Course", "channel": "freeCodeCamp.org"},
    "git": {"id": "RGOj5yH7evk", "title": "Git and GitHub for Beginners - Crash Course", "channel": "freeCodeCamp.org"},
    "github": {"id": "RGOj5yH7evk", "title": "Git and GitHub for Beginners - Crash Course", "channel": "freeCodeCamp.org"},
    "cicd": {"id": "scEDHsr3APg", "title": "DevOps CI/CD Explained in 100 Seconds", "channel": "Fireship"},
    "ci/cd": {"id": "scEDHsr3APg", "title": "DevOps CI/CD Explained in 100 Seconds", "channel": "Fireship"},
    "ci cd": {"id": "scEDHsr3APg", "title": "DevOps CI/CD Explained in 100 Seconds", "channel": "Fireship"},
    "terraform": {"id": "7xngnjfIlK8", "title": "Terraform Course - Automate Your AWS Cloud", "channel": "freeCodeCamp.org"},
    "devops": {"id": "j5Zsa_eOXeY", "title": "DevOps Engineering Course for Beginners", "channel": "freeCodeCamp.org"},
    "ansible": {"id": "1id6ERvfozo", "title": "Ansible Full Course - Learn Ansible", "channel": "Edureka"},

    # Data Science & ML
    "machine learning": {"id": "i_LwzRVP7bg", "title": "Machine Learning for Everybody", "channel": "freeCodeCamp.org"},
    "deep learning": {"id": "VyWAvY2CF9c", "title": "Deep Learning Crash Course for Beginners", "channel": "freeCodeCamp.org"},
    "data science": {"id": "ua-CiDNNj30", "title": "Data Science Full Course", "channel": "freeCodeCamp.org"},
    "pandas": {"id": "vmEHCJofslg", "title": "Pandas Tutorial - Data Analysis with Python", "channel": "Programming with Mosh"},
    "numpy": {"id": "QUT1VHiLmmI", "title": "NumPy Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "tensorflow": {"id": "tPYj3fFJGjk", "title": "TensorFlow 2.0 Complete Course", "channel": "freeCodeCamp.org"},
    "pytorch": {"id": "V_xro1bcAuA", "title": "PyTorch for Deep Learning - Full Course", "channel": "freeCodeCamp.org"},
    "nlp": {"id": "fNxaJsNG3-s", "title": "NLP Tutorial with Python", "channel": "freeCodeCamp.org"},
    "natural language processing": {"id": "fNxaJsNG3-s", "title": "NLP Tutorial with Python", "channel": "freeCodeCamp.org"},
    "computer vision": {"id": "oXlwWbU8l2o", "title": "OpenCV Course - Full Tutorial with Python", "channel": "freeCodeCamp.org"},
    "opencv": {"id": "oXlwWbU8l2o", "title": "OpenCV Course - Full Tutorial with Python", "channel": "freeCodeCamp.org"},
    "scikit-learn": {"id": "pqNCD_5r0IU", "title": "Scikit-Learn Course - Machine Learning in Python", "channel": "freeCodeCamp.org"},
    "sklearn": {"id": "pqNCD_5r0IU", "title": "Scikit-Learn Course - Machine Learning in Python", "channel": "freeCodeCamp.org"},
    "keras": {"id": "tPYj3fFJGjk", "title": "TensorFlow 2.0 Complete Course", "channel": "freeCodeCamp.org"},
    "power bi": {"id": "3u7MQz1EyPY", "title": "Power BI Full Course - Learn Power BI", "channel": "Edureka"},
    "tableau": {"id": "aHaOIvR00So", "title": "Tableau Full Course - Learn Tableau", "channel": "Edureka"},
    "excel": {"id": "opJgMi1IUrc", "title": "Microsoft Excel Tutorial for Beginners", "channel": "Kevin Stratvert"},
    "data analysis": {"id": "ua-CiDNNj30", "title": "Data Science Full Course", "channel": "freeCodeCamp.org"},
    "statistics": {"id": "xxpc-HPKN28", "title": "Statistics Fundamentals", "channel": "StatQuest"},
    "mlops": {"id": "9BgIDqAzfuA", "title": "MLOps Course - Machine Learning Engineering", "channel": "freeCodeCamp.org"},

    # Mobile Development
    "flutter": {"id": "VPvVD8t02U8", "title": "Flutter Course for Beginners", "channel": "freeCodeCamp.org"},
    "react native": {"id": "obH0Po_RGhk", "title": "React Native Tutorial for Beginners", "channel": "Programming with Mosh"},
    "android": {"id": "fis26HvvDII", "title": "Android Development for Beginners", "channel": "freeCodeCamp.org"},
    "ios": {"id": "comQ1-x2a1Q", "title": "iOS Development for Beginners", "channel": "CodeWithChris"},

    # Tools, Concepts & CS Fundamentals
    "figma": {"id": "HZuk6Wkx_Eg", "title": "Figma Tutorial for Beginners", "channel": "Flux Academy"},
    "firebase": {"id": "9kRgVxULQf8", "title": "Firebase - Back to the Basics", "channel": "Fireship"},
    "data structures": {"id": "8hly31xKli0", "title": "Data Structures Easy to Advanced", "channel": "freeCodeCamp.org"},
    "dsa": {"id": "8hly31xKli0", "title": "Data Structures and Algorithms", "channel": "freeCodeCamp.org"},
    "algorithms": {"id": "8hly31xKli0", "title": "Data Structures and Algorithms", "channel": "freeCodeCamp.org"},
    "system design": {"id": "m8Icp_Cid5o", "title": "System Design for Beginners", "channel": "Gaurav Sen"},
    "api design": {"id": "lsMQRaeKNDk", "title": "REST API Design Best Practices", "channel": "freeCodeCamp.org"},
    "testing": {"id": "r9HdJ8P6GQI", "title": "Software Testing Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "agile": {"id": "502ILHjX9EE", "title": "Agile Project Management Full Course", "channel": "Edureka"},
    "cybersecurity": {"id": "hXSFdwIOfnE", "title": "Full Ethical Hacking Course - Beginner", "channel": "freeCodeCamp.org"},
    "networking": {"id": "qiQR5rTSshw", "title": "Computer Networking Course - Network Engineering", "channel": "freeCodeCamp.org"},
    "oop": {"id": "pTB0EiLXUC8", "title": "Object-Oriented Programming Explained", "channel": "Programming with Mosh"},
    "design patterns": {"id": "v9ejT8FO-7I", "title": "Design Patterns in Plain English", "channel": "freeCodeCamp.org"},
    "microservices": {"id": "lTAcCNbJ7KE", "title": "Microservices Architecture Explained", "channel": "TechWorld with Nana"},
    "model deployment": {"id": "7t2alSnE2-I", "title": "Python API Development with FastAPI", "channel": "freeCodeCamp.org"},
    "web scraping": {"id": "XVv6mJpFOb0", "title": "Web Scraping with Python - Beautiful Soup", "channel": "freeCodeCamp.org"},
    "selenium": {"id": "GnpJujF9dBw", "title": "Selenium Full Course for Beginners", "channel": "Edureka"},
    "api": {"id": "lsMQRaeKNDk", "title": "REST API Design Best Practices", "channel": "freeCodeCamp.org"},
    "embeddings": {"id": "viZrOnJclY0", "title": "Word Embeddings - NLP Tutorial", "channel": "freeCodeCamp.org"},
    "transformers": {"id": "4Bdc55j80l8", "title": "Transformers Explained - NLP Course", "channel": "Hugging Face"},
    "llm": {"id": "jkrNMKz9pWU", "title": "Build LLM Apps - LangChain Course", "channel": "freeCodeCamp.org"},
    "langchain": {"id": "jkrNMKz9pWU", "title": "Build LLM Apps - LangChain Course", "channel": "freeCodeCamp.org"},
    "prompt engineering": {"id": "jkrNMKz9pWU", "title": "Build LLM Apps - LangChain Course", "channel": "freeCodeCamp.org"},

    # Engineering domains (for non-CS resumes)
    "matlab": {"id": "T_ekAD7U-wU", "title": "MATLAB Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "autocad": {"id": "aZqYq8rwBSo", "title": "AutoCAD Tutorial for Beginners", "channel": "SourceCAD"},
    "solidworks": {"id": "r9Gj-6OA9_s", "title": "SolidWorks Tutorial for Beginners", "channel": "CADCAMTutorial"},
    "arduino": {"id": "zJ-LqeX_fLU", "title": "Arduino Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "raspberry pi": {"id": "eZ74x6dVYes", "title": "Raspberry Pi Tutorial for Beginners", "channel": "NetworkChuck"},
    "embedded systems": {"id": "zJ-LqeX_fLU", "title": "Arduino Tutorial for Beginners", "channel": "freeCodeCamp.org"},
    "iot": {"id": "LlhmzVL5bm8", "title": "IoT Full Course - Internet of Things", "channel": "Edureka"},
    "blockchain": {"id": "gyMwXuJrbJQ", "title": "Blockchain Full Course", "channel": "Edureka"},
    "solidity": {"id": "gyMwXuJrbJQ", "title": "Blockchain Full Course", "channel": "Edureka"},
}


# ============================================================
# Smart skill name normalizer
# Handles Sarvam AI's verbose skill names like:
#   "Flask or FastAPI (for model deployment)" → ["flask", "fastapi"]
#   "Natural Language Processing (NLP)" → ["natural language processing", "nlp"]
#   "Advanced SQL" → ["sql"]
#   "AWS SageMaker or Google Cloud AI basics" → ["aws", "sagemaker", "google cloud"]
# ============================================================

# Words to strip (qualifiers that don't help matching)
_STRIP_WORDS = {
    "advanced", "basic", "basics", "intermediate", "beginner",
    "for", "the", "and", "or", "with", "using", "in", "of", "a",
    "model", "deployment", "development", "programming", "language",
    "framework", "library", "tool", "tools", "concepts", "fundamentals",
}

def _normalize_skill(raw_skill: str) -> list:
    """
    Convert one Sarvam AI skill string into multiple clean lookup keys.
    Returns a list of possible keys to try, ordered from most to least specific.
    """
    original = raw_skill.strip()
    lower = original.lower()
    candidates = []

    # 1. Try exact match first (lowered)
    candidates.append(lower)

    # 1b. Strip .js suffix: "React.js" → "react", "Node.js" → "nodejs"
    if lower.endswith(".js"):
        without_js = lower[:-3]
        candidates.append(without_js)
        candidates.append(without_js + "js")  # reactjs, nodejs

    # 2. Extract parenthetical abbreviations: "Natural Language Processing (NLP)" → "nlp"
    paren_match = re.search(r'\(([^)]+)\)', lower)
    if paren_match:
        abbr = paren_match.group(1).strip()
        candidates.append(abbr)
        # Also try without parenthetical
        without_paren = re.sub(r'\s*\([^)]*\)', '', lower).strip()
        candidates.append(without_paren)

    # 3. Split on " or " to handle "Flask or FastAPI" → ["flask", "fastapi"]
    if " or " in lower:
        parts = lower.split(" or ")
        for part in parts:
            clean = re.sub(r'\s*\([^)]*\)', '', part).strip()
            # Strip qualifier words
            words = [w for w in clean.split() if w not in _STRIP_WORDS]
            if words:
                candidates.append(" ".join(words))

    # 4. Strip qualifier words from the full string
    # "Advanced SQL" → "sql", "AWS SageMaker basics" → "aws sagemaker"
    words = re.sub(r'\s*\([^)]*\)', '', lower).split()
    cleaned = [w for w in words if w not in _STRIP_WORDS]
    if cleaned:
        candidates.append(" ".join(cleaned))
        # Also try individual significant words (for multi-word skills)
        if len(cleaned) > 1:
            for word in cleaned:
                if len(word) > 2:  # Skip tiny words
                    candidates.append(word)

    # Remove duplicates while preserving order
    seen = set()
    unique = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            unique.append(c)

    return unique


def _find_curated_video(skill: str):
    """
    Try to find a curated video using smart normalization.
    Returns (display_skill, video_data) or None.
    """
    candidates = _normalize_skill(skill)

    for candidate in candidates:
        if candidate in CURATED_VIDEOS:
            return _make_video_entry(skill, CURATED_VIDEOS[candidate])

    return None


def _make_video_entry(skill, video_data):
    """Build a video dict from curated data."""
    vid = video_data["id"]
    return {
        "skill": skill,
        "title": video_data["title"],
        "thumbnail": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
        "video_url": f"https://www.youtube.com/watch?v={vid}",
        "channel": video_data["channel"],
        "video_id": vid,
        "is_search_link": False,
    }


def _search_youtube_api(skill, api_key):
    """Search YouTube Data API v3 for high-quality, long-form tutorials."""
    # Improved query to fetch "proper" educational content
    query = f"{skill} full course tutorial crash course"
    
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 3,
        "relevanceLanguage": "en",
        "videoDuration": "long",  # Filter for videos > 20 minutes for "proper" learning
        "order": "relevance",
        "key": api_key,
    }
    try:
        response = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])
        if items:
            for item in items:
                video_id = item.get("id", {}).get("videoId", "")
                if not video_id:
                    continue
                    
                snippet = item.get("snippet", {})
                thumbnails = snippet.get("thumbnails", {})
                thumbnail_url = (
                    thumbnails.get("high", {}).get("url") or 
                    thumbnails.get("medium", {}).get("url") or 
                    thumbnails.get("default", {}).get("url") or 
                    ""
                )
                return {
                    "skill": skill,
                    "title": snippet.get("title", ""),
                    "thumbnail": thumbnail_url,
                    "video_url": f"https://www.youtube.com/watch?v={video_id}",
                    "channel": snippet.get("channelTitle", ""),
                    "video_id": video_id,
                    "is_search_link": False,
                }
    except requests.exceptions.HTTPError as http_err:
        status_code = http_err.response.status_code
        if status_code == 403:
            print(f"[YouTube API Quota] Error 403: Daily limit exceeded or invalid key for skill '{skill}'.")
        else:
            print(f"[YouTube API Error] HTTP {status_code} for skill '{skill}': {http_err}")
    except Exception as e:
        print(f"[YouTube API Error] Unexpected error for skill '{skill}': {e}")
    return None


def fetch_videos_for_skills(skills: list) -> list:
    """
    For each skill, return a real YouTube video with thumbnail,
    title, channel name, and playable link.

    Priority: Smart curated match → YouTube API → Search link fallback
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    has_api = api_key and api_key != "your_youtube_api_key_here"
    results = []

    for skill in skills:
        # 1. Try curated database with smart normalization
        video = _find_curated_video(skill)
        if video:
            results.append(video)
            continue

        # 2. Try YouTube API if available
        if has_api:
            video = _search_youtube_api(skill, api_key)
            if video:
                results.append(video)
                continue

        # 3. Fallback: Robust YouTube search link
        # Use a more specific query and ensure it's not empty
        search_skill = skill or "career skills"
        query = urllib.parse.quote_plus(f"{search_skill} tutorial full course")
        
        results.append({
            "skill": skill,
            "title": f"Explore {search_skill} Tutorials",
            "thumbnail": "",
            "video_url": f"https://www.youtube.com/results?search_query={query}&sp=EgIQAQ%253D%253D", # sp=... filters for videos only
            "channel": "YouTube Search",
            "video_id": None,
            "is_search_link": True,
        })

    return results
