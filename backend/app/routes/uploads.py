# backend/app/routes/uploads.py
# Handles file uploads (resume and JD). Saves files locally and returns accessible URL/path.

import os
from flask import Blueprint, request, current_app, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid

upload_bp = Blueprint("uploads", __name__)

def allowed_file(filename):
    if not filename:
        return False
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in current_app.config.get('ALLOWED_EXTENSIONS', set())

def make_unique_filename(filename):
    # add timestamp + uuid to avoid collisions
    name = secure_filename(filename)
    base, ext = os.path.splitext(name)
    unique = f"{base}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
    return unique

# POST /api/upload/resume
@upload_bp.route("/resume", methods=["POST"])
def upload_resume():
    # Expect 'file' field in form-data
    if 'file' not in request.files:
        return jsonify({"error": "file field required"}), 400
    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "no file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "file type not allowed"}), 400

    filename = make_unique_filename(file.filename)
    save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    # return relative URL that frontend/backend can use (serve via /uploads/<filename>)
    file_url = f"/api/upload/files/{filename}"

    return jsonify({"message": "resume uploaded", "file_url": file_url}), 201

# POST /api/upload/jd
@upload_bp.route("/jd", methods=["POST"])
def upload_jd():
    if 'file' not in request.files:
        return jsonify({"error": "file field required"}), 400
    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "no file selected"}), 400
    # allow same extensions as resumes
    if not allowed_file(file.filename):
        return jsonify({"error": "file type not allowed"}), 400

    filename = make_unique_filename(file.filename)
    save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    file_url = f"/api/upload/files/{filename}"
    return jsonify({"message": "jd uploaded", "file_url": file_url}), 201

# To serve files in development: GET /api/upload/files/<filename>
@upload_bp.route("/files/<path:filename>", methods=["GET"])
def serve_file(filename):
    # Security: only serve from the uploads directory
    upload_folder = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_folder, filename, as_attachment=False)
