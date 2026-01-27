import re
import os
import PyPDF2
import speech_recognition as sr
from moviepy.editor import VideoFileClip
from thefuzz import fuzz  # Handles spelling mistakes
from pdfminer.high_level import extract_text  # 🟢 NEW: The Fix for "No Spaces"
from textblob import TextBlob  # 🟢 NEW: Sentiment Analysis

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


def analyze_sentiment(text):
    """
    🟢 NEW: Returns a score modifier based on confidence/positivity.
    """
    if not text:
        return 0, "No audio detected."

    # Analyze the text
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity  # Range: -1 (Negative) to +1 (Positive)
    subjectivity = analysis.sentiment.subjectivity  # Range: 0 (Objective) to 1 (Subjective)

    # Logic: High positivity (+0.3) gets bonus. Negative gets penalty.
    if polarity > 0.3:
        return 10, "Confident & Positive Tone (+10%)"
    elif polarity < -0.1:
        return -5, "Nervous or Negative Tone (-5%)"
    else:
        return 0, "Neutral Tone"


def calculate_ai_score(resume_path, video_path, job_skills):
    print(f"\n🧠 AI DEBUG START ------------------")
    print(f"📄 Resume Path: {resume_path}")
    print(f"🛠️ Raw Job Skills from DB: {job_skills}")

    # 1. Extraction
    resume_text = extract_text_from_pdf(resume_path)
    print(f"📝 Extracted Text Length: {len(resume_text)} characters")

    # 🟢 NEW: Process Video Text
    video_text = extract_text_from_video(video_path)

    # 🟢 NEW: Calculate Sentiment
    sentiment_bonus, sentiment_feedback = analyze_sentiment(video_text)
    print(f"🎤 Video Sentiment: {sentiment_feedback} (Bonus: {sentiment_bonus}%)")

    candidate_name = extract_name_from_text(resume_text)
    full_text = resume_text + " " + video_text

    # Safety Check
    if not full_text.strip():
        return 0, "Could not extract data from Resume or Video", None, "New Candidate"

    try:
        # 2. Skill Parsing
        import json
        required_skills = []

        if isinstance(job_skills, list):
            required_skills = [str(s).lower().strip() for s in job_skills]
        elif job_skills and job_skills.strip().startswith("["):
            try:
                loaded_list = json.loads(job_skills)
                required_skills = [str(s).lower().strip() for s in loaded_list]
            except:
                required_skills = [s.strip().lower() for s in job_skills.split(",")]
        else:
            required_skills = [s.strip().lower() for s in job_skills.split(",")]

        required_skills = [s for s in required_skills if s]

        matched_count = 0
        total_weight = len(required_skills)
        matched_skills_list = []
        missing_skills_list = []

        # 3. Matching
        full_text_lower = full_text.lower()

        for skill in required_skills:
            escaped_skill = re.escape(skill)
            is_match = False

            # Check Exact
            if skill in full_text_lower:
                is_match = True

            # Check Synonym
            if not is_match and skill in SYNONYM_DB:
                for syn in SYNONYM_DB[skill]:
                    if syn in full_text_lower:
                        is_match = True
                        break

            # Check Fuzzy
            if not is_match:
                if fuzz.partial_token_set_ratio(skill, full_text_lower) > 90:
                    is_match = True

            if is_match:
                matched_count += 1
                matched_skills_list.append(skill.title())
            else:
                missing_skills_list.append(skill.title())

        # 4. Score Calculation (UPDATED WITH SENTIMENT)
        base_score = int((matched_count / total_weight) * 100) if total_weight > 0 else 0

        # 🟢 Apply the Bonus/Penalty
        final_score = base_score + sentiment_bonus

        # Cap at 100, Floor at 0
        final_score = max(0, min(100, final_score))

        print(f"🏆 BASE: {base_score}% | SENTIMENT: {sentiment_bonus}% | FINAL: {final_score}%")

        # 5. Feedback
        if missing_skills_list:
            feedback_str = f"Missing skills: {', '.join(missing_skills_list[:3])}. {sentiment_feedback}"
        else:
            feedback_str = f"Excellent match! {sentiment_feedback}"

        ai_graph_data = {
            "matched": matched_skills_list,
            "missing": missing_skills_list,
            "sentiment": sentiment_feedback  # Store for graphs
        }

        return final_score, feedback_str, ai_graph_data, candidate_name

    except Exception as e:
        print(f"❌ CRITICAL CALCULATION ERROR: {e}")
        return 0, "Error calculating score", None, "New Candidate"