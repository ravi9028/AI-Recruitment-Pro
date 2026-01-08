# backend/app/routes/api.py
print("🔥 api.py has been loaded by Flask")

from app.ai_engine import calculate_ai_score, extract_text_from_pdf, extract_name_from_text
from flask_mail import Message
from app import mail
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User, Job, Candidate, Application, CandidatePreference
from flask_jwt_extended import verify_jwt_in_request
from flask_cors import cross_origin
import os
import uuid
import json
from werkzeug.utils import secure_filename
from sqlalchemy import text
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
    get_jwt_identity,
    create_access_token
)

from datetime import timedelta

# -------------------------------------------------------
# BLUEPRINT
# -------------------------------------------------------
api_bp = Blueprint("api", __name__)

# Token expiry time
ACCESS_EXPIRES = timedelta(hours=4)


# -------------------------------------------------------
# ROLE CHECK DECORATOR
# -------------------------------------------------------
def role_required(required_role):
    def wrapper(fn):
        @jwt_required()
        def inner(*args, **kwargs):
            try:
                claims = get_jwt()
            except Exception as e:
                return jsonify({"error": "Invalid token"}), 401

            user_role = claims.get("role")
            if user_role != required_role:
                return jsonify({"error": "Insufficient permissions"}), 403

            return fn(*args, **kwargs)

        inner.__name__ = fn.__name__
        return inner

    return wrapper


# -------------------------------------------------------
# PING
# -------------------------------------------------------
@api_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200


# -------------------------------------------------------
# REGISTER
# -------------------------------------------------------
@api_bp.route("/register", methods=["POST"])
def register():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "candidate")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed = generate_password_hash(password)
    user = User(email=email, password_hash=hashed, role=role)
    db.session.add(user)
    db.session.commit()

    if role == "candidate":
        new_candidate = Candidate(
            user_id=user.id,
            email=email,
            name="New Candidate",
        )
        db.session.add(new_candidate)
        db.session.commit()

    return jsonify({"message": "User registered", "user_id": user.id}), 201


# -------------------------------------------------------
# GET CANDIDATE PROFILE
# -------------------------------------------------------
@api_bp.route("/candidate/profile", methods=["GET"])
@jwt_required()
def get_current_candidate():
    user_id = get_jwt_identity()
    candidate = Candidate.query.filter_by(user_id=user_id).first()
    user = User.query.get(user_id)

    if not candidate:
        return jsonify({"error": "Profile not found"}), 404

    # Safe Skills Loader
    skills_data = candidate.skills
    if isinstance(skills_data, str):
        try:
            skills_data = json.loads(skills_data)
        except:
            skills_data = [skills_data] if skills_data else []

    return jsonify({
        "id": candidate.id,
        "name": candidate.name,
        "email": user.email,
        "phone": candidate.phone,
        "location": candidate.location,
        "skills": skills_data,
        "experience": candidate.experience,
        "education": getattr(candidate, 'education', ""),
        "resume": candidate.resume_url
    }), 200


# -------------------------------------------------------
# LOGIN
# -------------------------------------------------------
@api_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    extra_claims = {"role": user.role, "email": user.email}

    token = create_access_token(
        identity=str(user.id),
        additional_claims=extra_claims,
        expires_delta=ACCESS_EXPIRES
    )

    return jsonify({
        "message": "Login successful",
        "access_token": token,
        "role": user.role,
        "user_id": user.id
    }), 200


# -------------------------------------------------------
# CANDIDATE PROFILE UPDATE
# -------------------------------------------------------
@api_bp.route("/candidate/update", methods=["PUT"])
@cross_origin()
@jwt_required()
def update_candidate_profile():
    try:
        user_id = get_jwt_identity()
        candidate = Candidate.query.filter_by(user_id=user_id).first()

        if not candidate:
            return jsonify({"error": "Candidate record not found"}), 404

        data = request.get_json()

        candidate.name = data.get("name", candidate.name)
        candidate.phone = data.get("phone", candidate.phone)
        candidate.location = data.get("location", candidate.location)
        candidate.experience = data.get("experience", candidate.experience)

        if hasattr(candidate, 'education'):
            candidate.education = data.get("education", getattr(candidate, 'education', ''))

        new_skills = data.get("skills")
        if new_skills is not None:
            if isinstance(new_skills, list):
                candidate.skills = json.dumps(new_skills)
            else:
                candidate.skills = new_skills

        # Handle Resume Upload
        resume_url = data.get("resume_url") or data.get("resume")

        if resume_url:
            candidate.resume_url = resume_url
            filename = resume_url.split("/")[-1]
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)

            if os.path.exists(file_path):
                try:
                    text = extract_text_from_pdf(file_path)
                    extracted_name = extract_name_from_text(text)

                    current_name_clean = candidate.name.strip().lower()
                    if current_name_clean in ["new candidate", "", "null"]:
                        if extracted_name and extracted_name != "New Candidate":
                            candidate.name = extracted_name
                except Exception as e:
                    print(f"⚠️ Extraction Warning: {e}")

        db.session.commit()
        return jsonify({"message": "Profile updated successfully", "name": candidate.name}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database Error: {str(e)}"}), 500


# -------------------------------------------------------
# HR JOB CREATION
# -------------------------------------------------------
@api_bp.route("/hr/create-job", methods=["POST"]) # <--- UPDATED TO MATCH FRONTEND
@role_required("hr")
def create_job():
    data = request.json
    if not data:
        return jsonify({"error": "Empty or invalid JSON"}), 422

    user_id = get_jwt_identity()

    try:
        job = Job(
            title=data.get("title"),
            description=data.get("description"),
            required_skills=data.get("required_skills"),
            location=data.get("location"),
            experience_required=data.get("experience_required"),
            jd_file_url=data.get("jd_file_url"),
            created_by=user_id
        )

        db.session.add(job)
        db.session.commit()
        return jsonify({"message": "Job Created", "job_id": job.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server failed", "details": str(e)}), 422


@api_bp.route("/jobs/<int:job_id>", methods=["GET"])
@jwt_required()
def get_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({
        "job": {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills,
            "location": job.location,
            "experience_required": job.experience_required,
            "jd_file_url": job.jd_file_url,
            "created_by": job.created_by,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
    }), 200


# -------------------------------------------------------
# GET ALL JOBS (HR ONLY)
# -------------------------------------------------------
@api_bp.route("/hr/jobs", methods=["GET"])
@role_required("hr")
def get_jobs():
    current_user = get_jwt_identity()
    jobs = Job.query.filter_by(created_by=current_user).all()
    job_list = []
    for j in jobs:
        job_list.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "required_skills": j.required_skills,
            "location": j.location,
            "experience_required": j.experience_required,
            "jd_file_url": j.jd_file_url,
            "created_by": j.created_by,
            "created_at": j.created_at.strftime("%Y-%m-%d %H:%M:%S") if j.created_at else None,
            "application_count": len(j.applications) if j.applications else 0
        })

    return jsonify({"jobs": job_list}), 200


# -------------------------------------------------------
# UPDATE JOB (HR ONLY)
# -------------------------------------------------------
@api_bp.route("/jobs/<int:job_id>", methods=["PUT"])
@role_required("hr")
def update_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.json or {}
    job.title = data.get("title", job.title)
    job.description = data.get("description", job.description)
    job.required_skills = data.get("required_skills", job.required_skills)
    job.location = data.get("location", job.location)
    job.experience_required = data.get("experience_required", job.experience_required)
    job.jd_file_url = data.get("jd_file_url", job.jd_file_url)

    db.session.commit()
    return jsonify({"message": "Job updated successfully"}), 200


# -------------------------------------------------------
# DELETE JOB (HR ONLY)
# -------------------------------------------------------
@api_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
@role_required("hr")
def delete_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Job deleted successfully"}), 200


# -------------------------------------------------------
# CREATE CANDIDATE
# -------------------------------------------------------
@api_bp.route("/candidates", methods=["POST"])
@jwt_required()
def create_candidate():
    user_id = get_jwt_identity()
    data = request.json or {}

    existing = Candidate.query.filter_by(user_id=user_id).first()
    if existing:
        return jsonify({"message": "Candidate profile already exists", "id": existing.id}), 200

    candidate = Candidate(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        location=data.get("location"),
        experience=data.get("experience"),
        skills=data.get("skills"),
        resume_url=data.get("resume_url"),
        user_id=user_id
    )

    db.session.add(candidate)
    db.session.commit()
    return jsonify({"message": "Candidate profile created", "candidate_id": candidate.id}), 201


# -------------------------------------------------------
# APPLY JOB
# -------------------------------------------------------
@api_bp.route("/jobs/<int:job_id>/apply", methods=["POST"])
def apply_job(job_id):
    verify_jwt_in_request()
    user_id = get_jwt_identity()

    candidate = Candidate.query.filter_by(user_id=user_id).first()
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    existing = Application.query.filter_by(job_id=job_id, candidate_id=candidate.id).first()
    if existing:
        return jsonify({"message": "Already applied"}), 409

    resume = request.files.get("resume")
    if not resume:
        return jsonify({"error": "Resume is required"}), 400

    resume_filename = secure_filename(resume.filename)
    unique_resume_name = f"{uuid.uuid4().hex}_{resume_filename}"
    resume_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_resume_name)
    resume.save(resume_path)
    resume_url = f"/api/upload/files/{unique_resume_name}"

    video = request.files.get("video")
    video_url = None
    video_path = None

    if video:
        video_filename = secure_filename(video.filename)
        unique_video_name = f"{uuid.uuid4().hex}_{video_filename}"
        video_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_video_name)
        video.save(video_path)
        video_url = f"/api/upload/files/{unique_video_name}"

    # AI SCORING
    job = Job.query.get(job_id)
    ai_score = 0
    ai_feedback = ""
    ai_graph = None
    extracted_name = "New Candidate"

    if job and job.required_skills and resume_path:
        try:
            ai_score, ai_feedback, ai_graph, extracted_name = calculate_ai_score(
                resume_path,
                video_path,
                job.required_skills
            )
        except Exception as e:
            print(f"⚠️ AI Engine Error: {e}")

    form_name = request.form.get("full_name")
    final_name = form_name
    if not final_name or final_name == "New Candidate" or final_name == "null":
        final_name = extracted_name

    application = Application(
        job_id=job_id,
        candidate_id=candidate.id,
        full_name=final_name,
        email=request.form.get("email"),
        phone=request.form.get("phone"),
        cover_letter=request.form.get("cover_letter"),
        resume_url=resume_url,
        video_url=video_url,
        status="Applied",
        score=ai_score,
        feedback=ai_feedback,
        graph_data=ai_graph
    )

    db.session.add(application)
    db.session.commit()
    return jsonify({"message": "Applied successfully"}), 201


# ------------------------------
# Candidate Preferences Endpoints
# ------------------------------
@api_bp.route("/candidate/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    user_id = get_jwt_identity()
    pref = CandidatePreference.query.filter_by(user_id=user_id).first()
    if not pref:
        return jsonify({"preferences": None}), 200

    return jsonify({
        "preferences": {
            "id": pref.id,
            "preferred_role": pref.preferred_role,
            "preferred_location": pref.preferred_location,
            "experience_level": pref.experience_level,
            "expected_salary": pref.expected_salary,
            "created_at": pref.created_at.isoformat() if pref.created_at else None,
            "updated_at": pref.updated_at.isoformat() if pref.updated_at else None
        }
    }), 200


@api_bp.route("/candidate/preferences", methods=["POST"])
@jwt_required()
def create_or_update_preferences():
    user_id = get_jwt_identity()
    data = request.json or {}

    preferred_role = data.get("preferred_role")
    preferred_location = data.get("preferred_location")
    experience_level = data.get("experience_level")
    expected_salary = data.get("expected_salary")

    pref = CandidatePreference.query.filter_by(user_id=user_id).first()
    if not pref:
        pref = CandidatePreference(
            user_id=user_id,
            preferred_role=preferred_role,
            preferred_location=preferred_location,
            experience_level=experience_level,
            expected_salary=expected_salary
        )
        db.session.add(pref)
    else:
        pref.preferred_role = preferred_role
        pref.preferred_location = preferred_location
        pref.experience_level = experience_level
        pref.expected_salary = expected_salary

    db.session.commit()
    return jsonify({"message": "Preferences saved", "preferences_id": pref.id}), 201


@api_bp.route("/candidate/preferences", methods=["PATCH"])
@jwt_required()
def patch_preferences():
    user_id = get_jwt_identity()
    data = request.json or {}

    pref = CandidatePreference.query.filter_by(user_id=user_id).first()
    if not pref:
        return jsonify({"error": "Preferences not found"}), 404

    for field in ("preferred_role", "preferred_location", "experience_level", "expected_salary"):
        if field in data:
            setattr(pref, field, data[field])

    db.session.commit()
    return jsonify({"message": "Preferences updated"}), 200


@api_bp.route("/jobs", methods=["GET"])
def list_jobs():
    jobs = Job.query.order_by(Job.created_at.desc()).all()
    result = []
    for j in jobs:
        result.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "required_skills": j.required_skills,
            "location": j.location,
            "experience_required": j.experience_required,
            "jd_file_url": j.jd_file_url,
            "created_by": j.created_by,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        })
    return jsonify({"jobs": result}), 200


@api_bp.route("/candidate/applications", methods=["GET"])
@jwt_required()
def get_candidate_applications():
    user_id = get_jwt_identity()
    candidate = Candidate.query.filter_by(user_id=user_id).first()
    if not candidate:
        return jsonify({"applications": []})

    sql = text("""
            SELECT 
                a.id,
                a.job_id,
                j.title,
                j.location,
                a.status,
                a.created_at AS applied_at,
                a.meeting_link, 
                a.score,       
                a.feedback,  
                a.graph_data
            FROM application a
            JOIN job j ON j.id = a.job_id
            WHERE a.candidate_id = :cid
            ORDER BY a.created_at DESC
        """)
    result = db.session.execute(sql, {"cid": candidate.id})
    rows = [dict(row._mapping) for row in result]
    return jsonify({"applications": rows})


@api_bp.route("/hr/applications/<int:app_id>/status", methods=["PATCH"])
@jwt_required()
@role_required("hr")
def update_application_status(app_id):
    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["Shortlisted", "Rejected"]:
        return jsonify({"error": "Invalid status"}), 400

    app_record = Application.query.get_or_404(app_id)
    app_record.status = new_status

    if new_status == "Shortlisted":
        unique_room = f"Interview-{app_id}-{uuid.uuid4().hex[:6]}"
        app_record.meeting_link = f"https://meet.jit.si/{unique_room}"

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database Commit Failed", "details": str(e)}), 500

    email_body = ""
    if new_status == "Shortlisted":
        email_body = (
            f"Hello {app_record.full_name},\n\n"
            f"Congratulations! You have been Shortlisted for the interview.\n"
            f"Your Interview Link: {app_record.meeting_link}\n\n"
            f"Best Regards,\nHR Team"
        )
    elif new_status == "Rejected":
        email_body = (
            f"Hello {app_record.full_name},\n\n"
            f"Thank you for your interest. Unfortunately, we are not moving forward with your application.\n\n"
            f"💡 AI FEEDBACK AVAILABLE: We have generated a detailed analysis of your resume.\n"
            f"Please log in to your dashboard to view your 'Skill Gap Analysis' and see exactly where you lagged.\n\n"
            f"Best Regards,\nHR Team"
        )

    try:
        msg = Message(
            subject=f"Application Status Update: {new_status}",
            recipients=[app_record.email],
            body=email_body
        )
        mail.send(msg)
    except Exception as e:
        print(f"⚠️ Email failed (Ignored): {e}")

    return jsonify({
        "message": "Status updated successfully",
        "meeting_link": app_record.meeting_link
    }), 200


@api_bp.route("/applications/<int:app_id>/flag", methods=["POST"])
@jwt_required()
def flag_application(app_id):
    data = request.get_json()
    reason = data.get("reason", "Suspicious activity detected")
    app_record = Application.query.get_or_404(app_id)

    existing_feedback = app_record.feedback or ""
    app_record.feedback = f"{existing_feedback}\n🚩 ALERT: {reason}".strip()

    db.session.commit()
    return jsonify({"message": "Incident flagged"}), 200


# -------------------------------------------------------
# ✅ THE FIX: DOUBLE ROUTE (Accepts both URL styles)
# -------------------------------------------------------
@api_bp.route("/hr/jobs/<int:job_id>/applicants", methods=["GET"]) # Style 1
@api_bp.route("/jobs/<int:job_id>/applicants", methods=["GET"])    # Style 2 (Alias)
@cross_origin()
def get_job_applicants(job_id):
    try:
        print(f"🔎 Fetching applicants for Job ID: {job_id}")

        results = db.session.query(Application, Candidate, User) \
            .outerjoin(Candidate, Application.candidate_id == Candidate.id) \
            .outerjoin(User, Candidate.user_id == User.id) \
            .filter(Application.job_id == job_id).all()

        applicants_list = []
        for app, cand, user in results:
            # Handle cases where User/Candidate might be None (safety check)
            candidate_name = app.full_name or (cand.name if cand else "Unknown")
            candidate_email = app.email or (user.email if user else "No Email")

            # Safe Skills Parsing
            cand_skills = []
            if cand and cand.skills:
                try:
                    if isinstance(cand.skills, list):
                        cand_skills = cand.skills
                    elif isinstance(cand.skills, str):
                        cand_skills = json.loads(cand.skills)
                except:
                    cand_skills = [str(cand.skills)]

            applicants_list.append({
                "id": app.id,
                "ai_score": app.score or 0,
                "ai_feedback": app.feedback or "No feedback yet.",
                "status": app.status,
                "resume_url": app.resume_url,
                "user": {
                    "name": candidate_name,
                    "email": candidate_email,
                    "phone": cand.phone if cand else "N/A",
                    "location": cand.location if cand else "N/A",
                    "experience": cand.experience if cand else "No experience listed.",
                    "education": getattr(cand, 'education', "No education listed."),
                    "skills": cand_skills
                }
            })

        print(f"✅ Found {len(applicants_list)} applicants.")
        return jsonify({"applicants": applicants_list}), 200

    except Exception as e:
        print(f"🔥 ERROR in /applicants route: {str(e)}")
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------
# 🤖 RECRUITER CO-PILOT (AI CHATBOT) - UPGRADED & SAFE
# -------------------------------------------------------
@api_bp.route("/chat", methods=["POST"])
@cross_origin()
def chat_bot():
    try:
        data = request.json or {}
        user_message = data.get("message", "").lower()

        # 🟢 CO-PILOT LOGIC: Helping the Recruiter Work

        # 1. NAVIGATION ASSISTANCE
        if "post" in user_message or "create job" in user_message:
            reply = "To post a job, click 'Post New Job' in the left sidebar. You'll need the JD file and a list of required skills."

        elif "dashboard" in user_message or "home" in user_message:
            reply = "You are currently on the Dashboard. This gives you a bird's-eye view of active jobs and recent applications."

        elif "applicants" in user_message or "candidates" in user_message or "see" in user_message:
            reply = "To see candidates: Go to 'Job Inventory', click on any Job Card, and you will see the AI-ranked list of applicants."

        # 2. FEATURE EXPLANATION
        elif "score" in user_message or "ranking" in user_message or "ai" in user_message:
            reply = "The AI Score (0-100%) shows how well a resume matches the job description. Higher scores mean better skill overlap."

        elif "export" in user_message or "download" in user_message or "report" in user_message:
            reply = "You can download full reports from the 'Talent Intelligence' tab. Look for the 'Export CSV' button."

        # 3. ACTION ASSISTANCE
        elif "shortlist" in user_message or "interview" in user_message:
            reply = "To schedule an interview: Open a candidate's profile and click 'Shortlist'. I will automatically generate a video meeting link and email them."

        elif "delete" in user_message or "remove" in user_message:
            reply = "For security, only Admin Level 1 users can delete data. Please use the 'Danger Zone' in Settings if you have permission."

        # 4. GREETINGS & FALLBACK
        elif "hello" in user_message or "hi" in user_message:
            reply = "Hello! I am your RecruitPro Co-Pilot. I can help you navigate the portal. Try asking: 'How do I post a job?' or 'Where are the applicants?'"

        else:
            reply = "I am trained to help you navigate RecruitPro. Try asking about 'Posting Jobs', 'Screening Candidates', or 'Exporting Data'."

        return jsonify({"reply": reply}), 200

    except Exception as e:
        print(f"CHAT ERROR: {e}")
        return jsonify({"reply": "I'm having trouble connecting to the server. Please try again."}), 500
    