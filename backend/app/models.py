# backend/app/models.py

from app import db
from datetime import datetime


# -------------------------------------------------------
# USER MODEL (HR or Candidate login)
# -------------------------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="candidate")  # "hr" or "candidate"

    # relationships
    jobs = db.relationship("Job", backref="creator", lazy=True)
    candidates = db.relationship("Candidate", backref="owner", lazy=True)


# -------------------------------------------------------
# JOB MODEL (HR creates jobs)
# -------------------------------------------------------
class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)

    required_skills = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=True)
    experience_required = db.Column(db.String(100), nullable=True)

    salary_range = db.Column(db.String(100), nullable=True)
    jd_upload = db.Column(db.String(300), nullable=True)

    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    is_active = db.Column(db.Boolean, default=True)

    applications = db.relationship(
        "Application",
        backref="job",
        lazy=True,
        foreign_keys="Application.job_id"
    )


# -------------------------------------------------------
# CANDIDATE MODEL
# -------------------------------------------------------
class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=True)

    location = db.Column(db.String(100), nullable=True)
    experience = db.Column(db.String(100), nullable=True)
    education = db.Column(db.Text, nullable=True)
    skills = db.Column(db.Text, nullable=True)

    resume_url = db.Column(db.String(300), nullable=True)
    video_url = db.Column(db.String(300), nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship("Application", backref="candidate", lazy=True)


# -------------------------------------------------------
# APPLICATION MODEL
# -------------------------------------------------------
# backend/app/models.py

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidate.id'), nullable=False)

    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    cover_letter = db.Column(db.Text)
    resume_url = db.Column(db.String(255), nullable=False)

    video_url = db.Column(db.String(255), nullable=True)
    score = db.Column(db.Integer, default=0)
    feedback = db.Column(db.Text, nullable=True)
    graph_data = db.Column(db.JSON, nullable=True)

    status = db.Column(db.String(20), default='Applied')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    meeting_link = db.Column(db.String(255), nullable=True)
# These columns save the malpractice warnings permanently in the DB
    trust_score = db.Column(db.Integer, default=100)  # Starts at 100%
    tab_switches = db.Column(db.Integer, default=0)
    faces_detected = db.Column(db.String(50), default="Single Face")
    voices_detected = db.Column(db.String(50), default="Single Voice")
class CandidatePreference(db.Model):
    """
    SQLAlchemy model for candidate_preferences table.
    Stores a candidate's saved job search preferences.
    """
    __tablename__ = "candidate_preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    preferred_role = db.Column(db.String(255))
    preferred_location = db.Column(db.String(255))
    experience_level = db.Column(db.String(100))
    expected_salary = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationship (optional if you want access to user)
    user = db.relationship("User", backref=db.backref("preferences", lazy=True))
