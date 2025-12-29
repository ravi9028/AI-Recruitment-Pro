import os
import PyPDF2
import speech_recognition as sr
from moviepy.editor import VideoFileClip


def extract_text_from_pdf(pdf_path):
    """
    Opens a PDF file and extracts all text from it.
    """
    text = ""
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + " "
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return ""
    return text.lower()


def extract_text_from_video(video_path):

    if not video_path or not os.path.exists(video_path):
        return ""

    try:
        print("🎥 Processing Video for Audio...")
        # 1. Extract Audio using MoviePy
        video = VideoFileClip(video_path)
        audio_path = video_path.replace(".mp4", ".wav").replace(".webm", ".wav")
        video.audio.write_audiofile(audio_path, logger=None)

        # 2. Convert Audio to Text using SpeechRecognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_path) as source:
            audio_data = recognizer.record(source)
            # Use Google Web Speech API (Free & Built-in)
            text = recognizer.recognize_google(audio_data)

        # 3. Cleanup: Delete the temporary audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)

        print(f"✅ Video Transcript: {text}")
        return text.lower()

    except Exception as e:
        print(f"⚠️ Video Processing Error: {e}")
        return ""


def calculate_ai_score(resume_path, video_path, job_skills):

    # 1. Get Resume Text
    resume_text = extract_text_from_pdf(resume_path)

    # 2. Get Video Text (Phase 7.3 Requirement)
    video_text = extract_text_from_video(video_path)

    # 3. Combine Data Sources
    full_candidate_text = resume_text + " " + video_text

    if not full_candidate_text.strip():
        return 0, "Could not extract data from Resume or Video"

        # 4. Process Job Skills
        required_skills = [s.strip().lower() for s in job_skills.split(",")]

        # We will create a dictionary of skills and a 1 or 0 (Match or No Match)
        graph_points = {}
        matched_skills = []

        for skill in required_skills:
            if skill in full_candidate_text:
                matched_skills.append(skill)
                graph_points[skill] = 100  # Full match for this skill
            else:
                graph_points[skill] = 0  # No match for this skill

        score = int((len(matched_skills) / len(required_skills)) * 100) if required_skills else 0

        # ... (Keep feedback logic) ...

        # Return the score, the text feedback, AND the graph dictionary
        return score, feedback_str, graph_points
    # 5. Find Matches
    matched_skills = []
    missing_skills = []

    for skill in required_skills:
        if skill in full_candidate_text:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    # 6. Calculate Score
    score = int((len(matched_skills) / total_skills) * 100)

    # 7. Generate Feedback
    feedback_str = ""
    if missing_skills:
        feedback_str = "Missing skills: " + ", ".join(missing_skills)
    else:
        feedback_str = "Excellent! Your resume and video covered all requirements."

    return score, feedback_str