# backend/app/routes/api.py
print("🔥 api.py has been loaded by Flask")

# Add this at the top with your other imports
from pdfminer.high_level import extract_text
from app.ai_engine import calculate_ai_score, extract_text_from_pdf, extract_name_from_text
from flask_mail import Message
from app import mail
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User, Job, Candidate, Application, CandidatePreference
from flask_jwt_extended import verify_jwt_in_request
from flask_cors import cross_origin
import smtplib
import ssl
from email.message import EmailMessage
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

api_bp = Blueprint("api", __name__)
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
    print("\n🔵 STARTING PROFILE UPDATE...")
    try:
        user_id = get_jwt_identity()
        candidate = Candidate.query.filter_by(user_id=user_id).first()

        # 1. Get Data (Handle JSON or Form Data)
        data = request.form if request.form else (request.get_json() or {})

        print(f"   📨 Saving Data for: {candidate.name}")

        # 2. Update Basic Fields
        if "name" in data: candidate.name = data["name"]
        if "location" in data: candidate.location = data["location"]
        if "experience" in data: candidate.experience = data["experience"]
        if "education" in data: candidate.education = data["education"]

        # 🟢 ADD THIS MISSING LINE FOR PHONE
        if "phone" in data: candidate.phone = data["phone"]

        # 3. FIX SKILLS SAVING
        raw_skills = data.get("skills")
        if raw_skills:
            if isinstance(raw_skills, list):
                candidate.skills = json.dumps(raw_skills)
            elif isinstance(raw_skills, str):
                if raw_skills.strip().startswith("["):
                    candidate.skills = raw_skills
                elif "," in raw_skills:
                    candidate.skills = json.dumps([s.strip() for s in raw_skills.split(",")])
                else:
                    candidate.skills = json.dumps([raw_skills.strip()])

        # 4. FIX RESUME (File OR Link)
        file = request.files.get("resume")
        if file:
            # Case A: New File Uploaded
            filename = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_name)
            file.save(file_path)
            candidate.resume_url = f"/api/upload/files/{unique_name}"
            print("   ✅ New Resume File Saved")

        # 🟢 ADD THIS BLOCK (Handles saving without re-uploading)
        elif "resume_url" in data and data["resume_url"]:
            candidate.resume_url = data["resume_url"]
            print(f"   ✅ Resume URL Preserved: {candidate.resume_url}")

        db.session.commit()
        return jsonify({"message": "Profile updated", "name": candidate.name}), 200

    except Exception as e:
        db.session.rollback()
        print(f"🔥 PROFILE UPDATE ERROR: {e}")
        return jsonify({"error": str(e)}), 500


# In backend/app/routes/api.py

# In backend/app/routes/api.py

@api_bp.route("/hr/parse-jd", methods=["POST"])
@cross_origin()
@jwt_required()
def parse_jd():
    temp_path = None
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        filename = secure_filename(file.filename)
        temp_path = os.path.join(current_app.config["UPLOAD_FOLDER"], f"temp_{uuid.uuid4().hex}_{filename}")
        file.save(temp_path)

        # 🟢 BYPASS THE HELPER: Use pdfminer directly to get RAW text
        # This ensures no spaces are stripped by your other functions
        raw_text = extract_text(temp_path)

        # 🟢 FORCE SPACING: Convert newlines to spaces
        # This turns "Developer\nJob" -> "Developer Job"
        clean_text = raw_text.replace('\n', ' ').replace('\r', ' ')

        # Remove multiple spaces
        final_text = " ".join(clean_text.split())

        # Cleanup
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({
            "extractedText": final_text,
            "message": "Parsed successfully"
        }), 200

    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500
# -------------------------------------------------------
# HR JOB CREATION - MANUALLY SECURED (CORS SAFE)
# -------------------------------------------------------
@api_bp.route("/hr/create-job", methods=["POST", "OPTIONS"])
@cross_origin()
def create_job():
    # 🟢 1. Handle Preflight Manually
    if request.method == "OPTIONS":
        return jsonify({"msg": "ok"}), 200

    # 🟢 2. Check Auth Manually (Prevents 401 on Preflight)
    verify_jwt_in_request()
    claims = get_jwt()
    if claims.get("role") != "hr":
        return jsonify({"error": "Forbidden"}), 403

    # 3. Normal Logic...
    data = request.form if request.form else (request.get_json() or {})

    if not data:
        return jsonify({"error": "Empty data"}), 422

    user_id = get_jwt_identity()

    try:
        # Handle JD File Upload
        jd_path = None
        file = request.files.get("job_description_file")
        if file:
            filename = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_name)
            file.save(file_path)
            jd_path = f"/api/upload/files/{unique_name}"

        # Handle Skills (List or String)
        raw_skills = data.get("required_skills") or data.get("requiredSkills")
        final_skills = raw_skills

        if isinstance(raw_skills, list):
            final_skills = json.dumps(raw_skills)

        job_kwargs = {
            "title": data.get("title"),
            "description": data.get("description"),
            "required_skills": final_skills,
            "location": data.get("location"),
            "experience_required": data.get("experience_required"),
            "jd_upload": jd_path,
            "created_by": user_id
        }

        # 🟢 SAFE ADD: Only add salary if data is present
        if "salary_range" in data:
            job_kwargs["salary_range"] = data.get("salary_range")

        job = Job(**job_kwargs)
        db.session.add(job)
        db.session.commit()
        return jsonify({"message": "Job Created", "job_id": job.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server failed", "details": str(e)}), 422


# -------------------------------------------------------
# GET ALL JOBS (HR DASHBOARD) - FIXED (SAFE SALARY READ)
# -------------------------------------------------------
@api_bp.route("/hr/jobs", methods=["GET", "OPTIONS"])
@cross_origin()
def get_jobs():
    # 🟢 1. Handle Preflight
    if request.method == "OPTIONS":
        return jsonify({"msg": "ok"}), 200

    # 🟢 2. Check Auth
    verify_jwt_in_request()
    claims = get_jwt()
    if claims.get("role") != "hr":
        return jsonify({"error": "Forbidden"}), 403

    current_user = get_jwt_identity()

    # Fetch jobs
    jobs = Job.query.filter_by(created_by=current_user).order_by(Job.created_at.desc()).all()

    job_list = []
    for j in jobs:
        job_list.append({
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "required_skills": j.required_skills,
            "requiredSkills": j.required_skills,
            "location": j.location,
            "experience_required": j.experience_required,
            # 🟢 SAFE READ: Use getattr so it NEVER crashes if column is missing
            "salary_range": getattr(j, "salary_range", None),
            "jd_upload": j.jd_upload,
            "created_by": j.created_by,
            "created_at": j.created_at.strftime("%Y-%m-%d %H:%M:%S") if j.created_at else None,
            "application_count": len(j.applications) if j.applications else 0
        })

    return jsonify({"jobs": job_list}), 200


# -------------------------------------------------------
# GET SINGLE JOB (SAFE READ)
# -------------------------------------------------------
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
            "requiredSkills": job.required_skills,
            "location": job.location,
            "experience_required": job.experience_required,
            # 🟢 SAFE READ
            "salary_range": getattr(job, "salary_range", None),
            "jd_upload": job.jd_upload,
            "created_by": job.created_by,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
    }), 200


# -------------------------------------------------------
# UPDATE JOB (HR ONLY) - MANUALLY SECURED (CORS SAFE)
# -------------------------------------------------------
@api_bp.route("/jobs/<int:job_id>", methods=["PUT", "OPTIONS"])
@cross_origin()
def update_job(job_id):
    # 🟢 1. Handle Preflight
    if request.method == "OPTIONS":
        return jsonify({"msg": "ok"}), 200

    # 🟢 2. Check Auth
    verify_jwt_in_request()
    claims = get_jwt()
    if claims.get("role") != "hr":
        return jsonify({"error": "Forbidden"}), 403

    print(f"\n🔵 UPDATING JOB ID {job_id}...")
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.form if request.form else (request.get_json() or {})

    # 1. Handle File Upload
    file = request.files.get("job_description_file")
    if file:
        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_name)
        file.save(file_path)
        job.jd_upload = f"/api/upload/files/{unique_name}"

    # 2. Update Text Fields
    if "title" in data: job.title = data["title"]
    if "description" in data: job.description = data["description"]
    if "location" in data: job.location = data["location"]
    if "experience_required" in data: job.experience_required = data["experience_required"]

    # 🟢 SAFE WRITE: Check if model supports salary before setting
    if "salary_range" in data:
        if hasattr(job, "salary_range"):
            job.salary_range = data["salary_range"]

    # 3. Update Skills
    skills = data.get("required_skills") or data.get("requiredSkills")

    if skills is not None:
        if isinstance(skills, list):
            job.required_skills = json.dumps(skills)
        else:
            job.required_skills = skills

    db.session.commit()
    return jsonify({
        "message": "Job updated successfully",
        "salary_range": getattr(job, "salary_range", None),
        "required_skills": job.required_skills
    }), 200


# -------------------------------------------------------
# DELETE JOB (HR ONLY)
# -------------------------------------------------------
@api_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
@cross_origin()  # 🟢 Add this to prevent CORS errors on DELETE
@role_required("hr")
def delete_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    try:
        # 🟢 FIX: Manually delete applications first (Cascade Delete)
        Application.query.filter_by(job_id=job.id).delete()

        # Now delete the job
        db.session.delete(job)
        db.session.commit()
        return jsonify({"message": "Job and associated applications deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
    print(f"\n🚀 STARTING APPLICATION PROCESS FOR JOB {job_id}...")
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

        # --- AI SCORING (FIXED) ---
        job = Job.query.get(job_id)
        ai_score = 0
        ai_feedback = "AI scoring failed or skipped."
        ai_graph = None
        extracted_name = "New Candidate"

        if job and job.required_skills and resume_path:
            try:
                # 🟢 1. CLEAN THE SKILLS (Convert String -> List)
                skills_for_ai = []

                raw_skills = job.required_skills

                # Check if it's JSON format (e.g., '["Java", "Python"]')
                try:
                    skills_for_ai = json.loads(raw_skills)
                except:
                    # If not JSON, assume comma-separated (e.g., "Java, Python")
                    if isinstance(raw_skills, str):
                        skills_for_ai = [s.strip() for s in raw_skills.split(",") if s.strip()]

                # 🟢 2. PASS THE LIST TO AI ENGINE
                # (Now the AI receives ["LAN configuration", "Laptop setup"] correctly)
                ai_score, ai_feedback, ai_graph, extracted_name = calculate_ai_score(
                    resume_path,
                    video_path,
                    skills_for_ai
                )
            except Exception as e:
                print(f"🔥 AI ENGINE CRASHED: {e}")

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
            # 🟢 SAFE READ
            "salary_range": getattr(j, "salary_range", None),
            "jd_upload": j.jd_upload,
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
@cross_origin()
@jwt_required()
@role_required("hr")
def update_application_status(app_id):
    # 👇👇👇 RAW CREDENTIALS (NO FLASK CONFIG) 👇👇👇
    SENDER_EMAIL = "paint.it.onn@gmail.com"
    SENDER_PASSWORD = "mpiq cggy rlxc hfkr"  # Your 16-digit App Password
    # 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["Shortlisted", "Rejected", "Hired"]:
        return jsonify({"error": "Invalid status"}), 400

    app_record = Application.query.get_or_404(app_id)
    app_record.status = new_status

    # Generate Link
    if new_status == "Shortlisted" and not app_record.meeting_link:
        unique_room = f"Interview-{app_id}-{uuid.uuid4().hex[:6]}"
        app_record.meeting_link = f"https://meet.jit.si/{unique_room}"

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500

    # --- EMAIL LOGIC (RAW PYTHON) ---
    subject = f"Update: You are {new_status}!"
    body = ""

    if new_status == "Shortlisted":
        body = f"Hello {app_record.full_name},\n\nYou have been Shortlisted! Join here:\n{app_record.meeting_link}\n\n- RecruitPro HR"
    elif new_status == "Hired":
        body = f"Hello {app_record.full_name},\n\nCongratulations! You are Hired.\n\n- RecruitPro HR"
    elif new_status == "Rejected":
        body = f"Hello {app_record.full_name},\n\nThank you for applying.\n\n- RecruitPro HR"

    # 🟢 DIRECT GMAIL CONNECTION (Bypasses Flask)
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL
        msg["To"] = app_record.email

        # Connect to Gmail Port 587 (TLS)
        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls(context=context)  # Secure the connection
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)

        print(f"✅ RAW SMTP SUCCESS: Email sent to {app_record.email}")

    except Exception as e:
        print(f"❌ RAW SMTP FAILED: {e}")
        # We catch the error so the app doesn't crash

    return jsonify({
        "message": f"Status updated to {new_status}",
        "meeting_link": app_record.meeting_link
    }), 200
# -------------------------------------------------------
# 🚨 AUTOMATED PROCTORING ENDPOINT (Updates DB Real-Time)
# -------------------------------------------------------
@api_bp.route("/applications/<int:app_id>/flag", methods=["POST"])
@jwt_required()
def flag_application(app_id):
    try:
        data = request.get_json()
        violation_type = data.get("type")  # tab_switch, multiple_faces, etc.
        reason = data.get("reason", "Suspicious Activity")

        app_record = Application.query.get_or_404(app_id)

        # 1. Initialize defaults if they are None (Safety Check)
        if app_record.trust_score is None: app_record.trust_score = 100
        if app_record.tab_switches is None: app_record.tab_switches = 0

        # 2. APPLY PENALTIES BASED ON VIOLATION TYPE
        if violation_type == "tab_switch":
            app_record.tab_switches += 1
            app_record.trust_score = max(0, app_record.trust_score - 5)  # -5% per switch

        elif violation_type == "multiple_faces":
            app_record.faces_detected = "Multiple Faces"
            app_record.trust_score = max(0, app_record.trust_score - 5)  # -20% for cheating

        elif violation_type == "no_face":
            app_record.faces_detected = "No Face Detected"
            app_record.trust_score = max(0, app_record.trust_score - 10)  # -10% for leaving seat

        elif violation_type == "multiple_voices":
            app_record.voices_detected = "Multiple Voices"
            app_record.trust_score = max(0, app_record.trust_score - 5)  # -10% for talking

        # 3. Log into Feedback for History
        existing_log = app_record.feedback or ""
        # Only log if it's a significant event to avoid spamming the text field
        app_record.feedback = f"{existing_log}\n⚠️ {reason}".strip()

        db.session.commit()

        print(f"📉 Score Updated for App {app_id}: {app_record.trust_score}% ({violation_type})")
        return jsonify({
            "message": "Flag recorded",
            "new_trust_score": app_record.trust_score
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"🔥 Flag Error: {e}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------
# ✅ THE FIX: DOUBLE ROUTE (Accepts both URL styles)
# -------------------------------------------------------
# -------------------------------------------------------
# ✅ GET APPLICANTS (NOW WITH SENTIMENT DATA)
# -------------------------------------------------------
@api_bp.route("/hr/jobs/<int:job_id>/applicants", methods=["GET"])
@api_bp.route("/jobs/<int:job_id>/applicants", methods=["GET"])
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
            candidate_name = app.full_name or (cand.name if cand else "Unknown")
            candidate_email = app.email or (user.email if user else "No Email")

            # 1. Safe Skills Parsing
            cand_skills = []
            if cand and cand.skills:
                try:
                    if isinstance(cand.skills, list):
                        cand_skills = cand.skills
                    elif isinstance(cand.skills, str):
                        cand_skills = json.loads(cand.skills)
                except:
                    cand_skills = [str(cand.skills)]

            # 🟢 2. EXTRACT VIDEO SENTIMENT (New Logic)
            video_sentiment = "Not Analyzed"
            if app.graph_data:
                try:
                    # Handle both dict (if DB driver converts it) and string JSON
                    gd = app.graph_data if isinstance(app.graph_data, dict) else json.loads(app.graph_data)
                    video_sentiment = gd.get("sentiment", "Not Analyzed")

                    # Clean up the string (e.g., remove "Tone" or extra text if needed)
                    if "Positive" in video_sentiment:
                        video_sentiment = "Positive"
                    elif "Negative" in video_sentiment:
                        video_sentiment = "Negative"
                    elif "Neutral" in video_sentiment:
                        video_sentiment = "Neutral"
                    elif "Nervous" in video_sentiment:
                        video_sentiment = "Nervous"
                except Exception as e:
                    print(f"⚠️ Error parsing graph_data for App {app.id}: {e}")

            applicants_list.append({
                "id": app.id,
                "ai_score": app.score or 0,
                "ai_feedback": app.feedback or "No feedback yet.",
                "trust_score": app.trust_score,
                "video_sentiment": video_sentiment,  # 🟢 NEW FIELD SENT TO FRONTEND
                "tab_switches": app.tab_switches,
                "faces_detected": app.faces_detected,
                "voices_detected": app.voices_detected,
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

    # -------------------------------------------------------
    # 📊 HR ANALYTICS ENDPOINT (REAL DATA)
    # -------------------------------------------------------


# -------------------------------------------------------
# 📊 HR ANALYTICS - UPGRADED FOR JOB-SPECIFIC GRAPHS
# -------------------------------------------------------
# -------------------------------------------------------
# 📊 HR ANALYTICS - UPGRADED: QUALITY DISTRIBUTION
# -------------------------------------------------------
# -------------------------------------------------------
# 📊 HR ANALYTICS - THE TALENT MATRIX UPDATE
# -------------------------------------------------------
@api_bp.route("/hr/analytics", methods=["GET"])
@jwt_required()
@role_required("hr")
def get_analytics():
    try:
        job_id = request.args.get('job_id')

        query = Application.query
        if job_id and job_id != "all":
            query = query.filter_by(job_id=job_id)

        apps = query.all()
        total = len(apps)

        if total == 0:
            return jsonify({
                "total": 0, "avg_score": 0, "avg_trust": 0,
                "sentiment": [], "funnel": [],
                "matrix": []  # 🟢 Empty Matrix
            })

        # 1. Averages
        total_ai = sum(app.score for app in apps if app.score is not None)
        total_trust = sum(app.trust_score for app in apps if app.trust_score is not None)

        # 2. Sentiment Data
        sent_counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
        for app in apps:
            if app.graph_data:
                gd = app.graph_data if isinstance(app.graph_data, dict) else json.loads(app.graph_data)
                s_text = gd.get("sentiment", "Neutral")
                if "Positive" in s_text:
                    sent_counts["Positive"] += 1
                elif "Negative" in s_text:
                    sent_counts["Negative"] += 1
                else:
                    sent_counts["Neutral"] += 1

        sentiment_data = [
            {"name": "Positive", "value": sent_counts["Positive"], "fill": "#10b981"},
            {"name": "Neutral", "value": sent_counts["Neutral"], "fill": "#64748b"},
            {"name": "Negative", "value": sent_counts["Negative"], "fill": "#ef4444"}
        ]

        # 3. Funnel Data
        funnel_data = [
            {"name": "Applied", "value": total, "fill": "#3b82f6"},
            {"name": "Shortlisted", "value": len([a for a in apps if a.status == "Shortlisted"]), "fill": "#f59e0b"},
            {"name": "Hired", "value": len([a for a in apps if a.status == "Hired"]), "fill": "#10b981"},
            {"name": "Rejected", "value": len([a for a in apps if a.status == "Rejected"]), "fill": "#ef4444"}
        ]

        # 🟢 4. TALENT MATRIX DATA (Scatter Plot Points)
        # We map every candidate to an X (Trust) and Y (Skill) coordinate
        matrix_data = []
        for app in apps:
            matrix_data.append({
                "name": app.full_name.split()[0] if app.full_name else "Unknown",  # Just first name for graph
                "x": app.trust_score or 0,  # X Axis: Trust
                "y": app.score or 0,  # Y Axis: AI Skill Score
                "status": app.status
            })

        return jsonify({
            "total": total,
            "avg_score": round(total_ai / total, 1) if total > 0 else 0,
            "avg_trust": round(total_trust / total, 1) if total > 0 else 0,
            "sentiment": sentiment_data,
            "funnel": funnel_data,
            "matrix": matrix_data  # 🟢 Sending the dots
        }), 200

    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"error": str(e)}), 500