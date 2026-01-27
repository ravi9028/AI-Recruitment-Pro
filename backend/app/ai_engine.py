import re
import os
import PyPDF2
import speech_recognition as sr
from moviepy.editor import VideoFileClip
from thefuzz import fuzz  # Handles spelling mistakes
from pdfminer.high_level import extract_text  # 🟢 NEW: The Fix for "No Spaces"

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
    """
    🟢 FIXED VERSION: Uses pdfminer to ensure spaces are preserved.
    Replaces the old PyPDF2 logic that was deleting spaces.
    """
    try:
        # 1. Extract Raw Text using the robust library
        text = extract_text(pdf_path)

        # 2. Fix Spacing (Convert newlines to spaces)
        # This turns "Java\nDeveloper" into "Java Developer"
        text = text.replace('\n', ' ').replace('\r', ' ')

        # 3. Basic Cleanup (Remove multi-spaces, keep special chars like + and #)
        # We keep . + # - to support "C++", "C#", "Node.js", "React-Native"
        # The old regex [^a-z0-9] was deleting C++ and C#
        text = re.sub(r'[^a-zA-Z0-9\s.+\-#]', '', text)

        # 4. Collapse multiple spaces
        text = re.sub(r'\s+', ' ', text).strip()

        return text.lower()
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return ""


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
    print(f"\n🧠 AI DEBUG START ------------------")
    print(f"📄 Resume Path: {resume_path}")
    print(f"🛠️ Raw Job Skills from DB: {job_skills}")

    # 1. Extraction (Now using the FIXED parser)
    resume_text = extract_text_from_pdf(resume_path)
    print(f"📝 Extracted Text Length: {len(resume_text)} characters")

    # Debug: Print first 100 chars to see if it's garbage
    print(f"📝 Text Preview: {resume_text[:100]}...")

    if len(resume_text) < 50:
        print("❌ CRITICAL: Resume text is too short or empty! (Is it an image PDF?)")

    candidate_name = extract_name_from_text(resume_text)
    video_text = extract_text_from_video(video_path)
    full_text = resume_text + " " + video_text

    # Safety Check
    if not full_text.strip():
        return 0, "Could not extract data from Resume or Video", None, "New Candidate"

    try:
        # 2. Skill Parsing (With Prints)
        import json
        required_skills = []

        # Check if it looks like a JSON list (starts with bracket)
        if isinstance(job_skills, list):
            required_skills = [str(s).lower().strip() for s in job_skills]
        elif job_skills and job_skills.strip().startswith("["):
            try:
                loaded_list = json.loads(job_skills)
                required_skills = [str(s).lower().strip() for s in loaded_list]
                print(f"✅ JSON Skills Parsed: {required_skills}")
            except:
                required_skills = [s.strip().lower() for s in job_skills.split(",")]
                print(f"⚠️ JSON Parse Failed, fell back to CSV: {required_skills}")
        else:
            required_skills = [s.strip().lower() for s in job_skills.split(",")]
            print(f"✅ CSV Skills Parsed: {required_skills}")

        # Clean up
        required_skills = [s for s in required_skills if s]

        graph_points = {}
        matched_count = 0
        total_weight = len(required_skills)
        matched_skills_list = []
        missing_skills_list = []

        # 3. Matching (With Prints)
        full_text_lower = full_text.lower()  # Ensure lowercase match

        for skill in required_skills:
            # A. Exact Match
            # Use strict boundaries ONLY for simple words to avoid partial matches
            # But allow substring matching for complex terms (e.g., C++)
            escaped_skill = re.escape(skill)

            # Default: Assume match if the skill string exists in text
            is_match = False
            if skill in full_text_lower:
                is_match = True

            # B. Synonym Match
            if not is_match and skill in SYNONYM_DB:
                for syn in SYNONYM_DB[skill]:
                    if syn in full_text_lower:
                        is_match = True
                        break

            # C. Fuzzy Match
            if not is_match:
                if fuzz.partial_token_set_ratio(skill, full_text_lower) > 90:
                    is_match = True

            # Final Decision
            if is_match:
                print(f"   ✅ MATCHED: {skill}")
                matched_count += 1
                graph_points[skill] = 100
                matched_skills_list.append(skill.title())
            else:
                print(f"   ❌ MISSING: {skill}")
                graph_points[skill] = 0
                missing_skills_list.append(skill.title())

        # 4. Score Calculation
        score = int((matched_count / total_weight) * 100) if total_weight > 0 else 0
        print(f"🏆 FINAL SCORE: {score}%")
        print(f"🧠 AI DEBUG END --------------------\n")

        # 5. Feedback
        if missing_skills_list:
            feedback_str = f"Missing critical skills: {', '.join(missing_skills_list[:3])}."
        else:
            feedback_str = "Excellent match! Candidate possesses all required skills."

        ai_graph_data = {
            "matched": matched_skills_list,
            "missing": missing_skills_list
        }

        return score, feedback_str, ai_graph_data, candidate_name

    except Exception as e:
        print(f"❌ CRITICAL CALCULATION ERROR: {e}")
        return 0, "Error calculating score", None, "New Candidate"