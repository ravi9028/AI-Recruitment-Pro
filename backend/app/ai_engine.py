import re
import os
import PyPDF2
import speech_recognition as sr
from moviepy.editor import VideoFileClip
from thefuzz import fuzz  # 🟢 NEW: Handles spelling mistakes

# ---------------------------------------------------------
# 🧠 INTELLIGENT SKILL MAPPING (The Brain)
# ---------------------------------------------------------
# This allows the AI to understand that "React.js" is the same as "React"
SYNONYM_DB = {
    "react": ["reactjs", "react.js", "react native"],
    "js": ["javascript", "es6", "ecmascript"],
    "python": ["py", "python3", "django", "flask"],
    "java": ["j2ee", "spring boot", "jvm"],
    "ml": ["machine learning", "ai", "artificial intelligence", "deep learning"],
    "aws": ["amazon web services", "ec2", "s3", "lambda"],
    "communication": ["communicated", "communicating", "verbal skills"],
    "node": ["node.js", "nodejs", "express"],
    "sql": ["mysql", "postgresql", "database", "query"],
}


def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + " "
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return ""
    # 🟢 IMPROVEMENT: Remove special characters for cleaner matching
    return re.sub(r'[^a-zA-Z0-9\s.+]', '', text.lower())


def extract_name_from_text(text):
    if not text:
        return "New Candidate"
    lines = text.split('\n')
    for line in lines:
        clean_line = line.strip()
        if not clean_line or len(clean_line) < 3 or len(clean_line) > 50:
            continue
        bad_keywords = ["resume", "cv", "curriculum", "vitae", "profile", "bio", "template", ".pdf"]
        if any(keyword in clean_line.lower() for keyword in bad_keywords):
            continue
        if clean_line[0].isdigit():
            continue
        return clean_line.title()
    return "New Candidate"


def extract_text_from_video(video_path):
    if not video_path or not os.path.exists(video_path):
        return ""
    try:
        print("🎥 Processing Video for Audio...")
        video = VideoFileClip(video_path)
        audio_path = video_path.replace(".mp4", ".wav").replace(".webm", ".wav")
        video.audio.write_audiofile(audio_path, logger=None)

        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)

        if os.path.exists(audio_path):
            os.remove(audio_path)
        return text.lower()
    except Exception as e:
        print(f"⚠️ Video Processing Error: {e}")
        return ""


def calculate_ai_score(resume_path, video_path, job_skills):
    # 1. Extraction
    resume_text = extract_text_from_pdf(resume_path)
    candidate_name = extract_name_from_text(resume_text)
    video_text = extract_text_from_video(video_path)
    full_text = resume_text + " " + video_text

    if not full_text.strip():
        return 0, "Could not extract data from Resume or Video", None, "New Candidate"

    try:
        # 2. Pre-process Required Skills (Handle Synonyms)
        required_skills = [s.strip().lower() for s in job_skills.split(",")]

        graph_points = {}
        matched_count = 0
        total_weight = len(required_skills)
        missing_skills = []

        # 🟢 SMART MATCHING LOGIC
        for skill in required_skills:

            # A. Check for Exact Word Match (Regex Boundary)
            # This prevents "Java" matching "JavaScript" incorrectly
            pattern = r'\b' + re.escape(skill) + r'\b'
            exact_match = re.search(pattern, full_text)

            # B. Check for Synonyms (Semantic Matching)
            synonym_match = False
            if not exact_match and skill in SYNONYM_DB:
                for syn in SYNONYM_DB[skill]:
                    if syn in full_text:
                        synonym_match = True
                        break

            # C. Check for Fuzzy Match (Typo Tolerance)
            # If candidate wrote "Recat" instead of "React"
            fuzzy_match = False
            if not exact_match and not synonym_match:
                # Check if any word in text is >90% similar
                if fuzz.partial_token_set_ratio(skill, full_text) > 90:
                    fuzzy_match = True

            # Final Decision
            if exact_match or synonym_match or fuzzy_match:
                matched_count += 1
                graph_points[skill] = 100
            else:
                missing_skills.append(skill)
                graph_points[skill] = 0

        # 3. Calculate Score
        score = int((matched_count / total_weight) * 100) if total_weight > 0 else 0

        # 4. Generate Feedback
        if missing_skills:
            feedback_str = f"Missing skills: {', '.join(missing_skills)}"
        else:
            feedback_str = "Excellent match! Candidate possesses all required skills."

        return score, feedback_str, graph_points, candidate_name

    except Exception as e:
        print(f"❌ Calculation Error: {e}")
        return 0, "Error calculating score", None, "New Candidate"