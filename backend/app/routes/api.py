# backend/app/routes/api.py
print("🔥 api.py has been loaded by Flask")

from flask import Blueprint, request, jsonify,  current_app
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User, Job, Candidate, Application,  CandidatePreference
from flask_jwt_extended import verify_jwt_in_request
from flask_cors import cross_origin
import os
import uuid
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
# BLUEPRINT — THIS MUST EXIST, backend crashed because it was removed
# -------------------------------------------------------
api_bp = Blueprint("api", __name__)

# Token expiry time
ACCESS_EXPIRES = timedelta(hours=4)


# -------------------------------------------------------
# ROLE CHECK DECORATOR WITH DEBUG PRINTS
# -------------------------------------------------------
def role_required(required_role):
    def wrapper(fn):
        @jwt_required()
        def inner(*args, **kwargs):
            print("\n------ JWT DEBUG ------")

            try:
                claims = get_jwt()
                print("JWT CLAIMS:", claims)
            except Exception as e:
                print("ERROR READING CLAIMS:", e)
                return jsonify({"error": "Invalid token"}), 401

            user_role = claims.get("role")
            print("EXTRACTED ROLE:", user_role)

            if user_role != required_role:
                print("ROLE MISMATCH, DENIED")
                return jsonify({"error": "Insufficient permissions"}), 403

            print("ROLE MATCH — ALLOWING REQUEST")
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

    return jsonify({"message": "User registered", "user_id": user.id}), 201


# -------------------------------------------------------
# LOGIN (returns JWT containing role)
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
        identity=str(user.id),  # FIX 1: force identity to string
        additional_claims=extra_claims,
        expires_delta=ACCESS_EXPIRES
    )

    print("TOKEN IDENTITY SENT:", user.id)  # DEBUG

    print("\n----- TOKEN DEBUG -----")
    print("USER ROLE FROM DB:", user.role)
    print("CLAIMS SENT IN TOKEN:", extra_claims)
    print("------------------------\n")

    return jsonify({
        "message": "Login successful",
        "access_token": token,
        "role": user.role,
        "user_id": user.id
    }), 200



# -------------------------------------------------------
# HR JOB CREATION (PROTECTED)
# -------------------------------------------------------
@api_bp.route("/jobs", methods=["POST"])
@role_required("hr")
def create_job():
    print("\n---- JOB CREATE DEBUG ----")

    data = request.json
    print("REQUEST JSON:", data)

    if not data:
        return jsonify({"error": "Empty or invalid JSON"}), 422

    # 🔥 FIXED INDENTATION
    user_id = get_jwt_identity()
    print("JWT IDENTITY RECEIVED:", user_id)

    if not user_id:
        return jsonify({"error": "No identity found"}), 422

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

        print("JOB CREATED WITH ID:", job.id)

        return jsonify({"message": "Job Created", "job_id": job.id}), 201

    except Exception as e:
        print("ERROR CREATING JOB:", str(e))
        db.session.rollback()
        return jsonify({"error": "Server failed", "details": str(e)}), 422

@api_bp.route("/jobs/<int:job_id>", methods=["GET"])
@jwt_required()
def get_job(job_id):
    claims = get_jwt()
    # optional: allow hr/admin only if you want
    # if claims.get('role') not in ['hr', 'admin']:
    #     return jsonify({"error":"Unauthorized"}), 403

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
        })

    return jsonify({"jobs":job_list}), 200

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
    user_id = get_jwt_identity()  # Identity from the JWT token
    data = request.json or {}

    # Check if a profile is already linked to this user
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
        user_id=user_id  # ✅ CRITICAL: Links the Candidate to the logged-in User
    )

    db.session.add(candidate)
    db.session.commit()
    return jsonify({"message": "Candidate profile created", "candidate_id": candidate.id}), 201

# JOB APPLY KARNE KE LIYE YEH API USE KIYA HAI
# @api_bp.route("/jobs/<int:job_id>/apply", methods=["OPTIONS"])
# def apply_job_options(job_id):
#     response = make_response()
#     response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
#     response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
#     response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
#     return response, 200

@api_bp.route("/jobs/<int:job_id>/apply", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173")
def apply_job(job_id):

    # ✅ Handle preflight FIRST
    if request.method == "OPTIONS":
        return "", 204

    # ✅ Now validate JWT
    verify_jwt_in_request()
    user_id = get_jwt_identity()

    # Get candidate
    candidate = Candidate.query.filter_by(user_id=user_id).first()
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    full_name = request.form.get("full_name")
    # Prevent duplicate
    existing = Application.query.filter_by(
        job_id=job_id,
        candidate_id=candidate.id
    ).first()
    if existing:
        return jsonify({"message": "Already applied"}), 409

    # Validate resume
    resume = request.files.get("resume")
    if not resume:
        return jsonify({"error": "Resume is required"}), 400

    # Read form fields
    full_name = request.form.get("full_name")
    email = request.form.get("email")
    phone = request.form.get("phone")
    cover_letter = request.form.get("cover_letter")

    # Save file
    filename = secure_filename(resume.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_name)
    resume.save(save_path)

    resume_url = f"/api/upload/files/{unique_name}"

    # Create application
    application = Application(
        job_id=job_id,
        candidate_id=candidate.id,
        full_name=full_name,
        email=email,
        phone=phone,
        resume_url=resume_url,
        cover_letter=cover_letter,
        status="Applied"
    )

    db.session.add(application)
    db.session.commit()

    return jsonify({"message": "Applied successfully"}), 201

# ------------------------------
# Candidate Preferences Endpoints
# ------------------------------

# GET preferences for current user
@api_bp.route("/candidate/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    """
    Returns the saved preferences for the logged-in candidate.
    """
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

# POST: create or update preferences (idempotent)
@api_bp.route("/candidate/preferences", methods=["POST"])
@jwt_required()
def create_or_update_preferences():
    """
    Create or update preferences for the logged-in user.
    The frontend sends JSON with preferred_role, preferred_location, experience_level, expected_salary.
    """
    user_id = get_jwt_identity()
    data = request.json or {}

    preferred_role = data.get("preferred_role")
    preferred_location = data.get("preferred_location")
    experience_level = data.get("experience_level")
    expected_salary = data.get("expected_salary")

    pref = CandidatePreference.query.filter_by(user_id=user_id).first()
    if not pref:
        # Create
        pref = CandidatePreference(
            user_id=user_id,
            preferred_role=preferred_role,
            preferred_location=preferred_location,
            experience_level=experience_level,
            expected_salary=expected_salary
        )
        db.session.add(pref)
    else:
        # Update
        pref.preferred_role = preferred_role
        pref.preferred_location = preferred_location
        pref.experience_level = experience_level
        pref.expected_salary = expected_salary

    db.session.commit()

    return jsonify({"message": "Preferences saved", "preferences_id": pref.id}), 201

# PATCH: update partial preferences (optional)
@api_bp.route("/candidate/preferences", methods=["PATCH"])
@jwt_required()
def patch_preferences():
    user_id = get_jwt_identity()
    data = request.json or {}

    pref = CandidatePreference.query.filter_by(user_id=user_id).first()
    if not pref:
        return jsonify({"error": "Preferences not found"}), 404

    # update fields if present
    for field in ("preferred_role", "preferred_location", "experience_level", "expected_salary"):
        if field in data:
            setattr(pref, field, data[field])

    db.session.commit()
    return jsonify({"message": "Preferences updated"}), 200

# public GET /api/jobs — returns all active jobs
@api_bp.route("/jobs", methods=["GET"])
def list_jobs():
    """
    Return all jobs. Public endpoint used by candidate dashboard.
    Optionally supports query parameters for filtering later (q, location, skill).
    """
    # simple: return all jobs
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
            a.created_at AS applied_at
        FROM application a
        JOIN job j ON j.id = a.job_id
        WHERE a.candidate_id = :cid
        ORDER BY a.created_at DESC
    """)

    result = db.session.execute(sql, {"cid": candidate.id})
    rows = [dict(row._mapping) for row in result]

    return jsonify({"applications": rows})


# -------------------------------------------------------
# HR – Get applicants for a specific job
# -------------------------------------------------------
@api_bp.route("/hr/jobs/<int:job_id>/applications", methods=["GET"])
@jwt_required()
def view_applicants(job_id):
    rows = (
        db.session.query(Application, Candidate, User)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .join(User, Candidate.user_id == User.id)
        .filter(Application.job_id == job_id)
        .all()
    )

    data = []
    for app, cand, user in rows:
        data.append({
            "application_id": app.id,
            "full_name": app.full_name or cand.name or user.email,
            "email": app.email or user.email,
            "phone": app.phone,
            "resume_url": app.resume_url,
            "status": app.status,
            "applied_at": app.created_at
        })

    return jsonify({"applications": data}), 200


@api_bp.route("/hr/applications/<int:app_id>/status", methods=["PATCH"])
@jwt_required()
def update_application_status(app_id):
    data = request.get_json()
    status = data.get("status")

    if status not in ["Shortlisted", "Rejected"]:
        return jsonify({"error": "Invalid status"}), 400

    app = Application.query.get_or_404(app_id)
    app.status = status
    db.session.commit()

    return jsonify({"message": "Status updated"}), 200

