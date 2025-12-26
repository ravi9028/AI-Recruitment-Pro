# backend/app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    load_dotenv()

    app = Flask(__name__)

    # -------------------------------------------
    # DATABASE CONFIG
    # -------------------------------------------
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # -------------------------------------------
    # JWT CONFIG
    # -------------------------------------------
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change_me")
    app.config["PROPAGATE_EXCEPTIONS"] = True

    # -------------------------------------------
    # UPLOAD CONFIG
    # -------------------------------------------
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB
    app.config["ALLOWED_EXTENSIONS"] = {"pdf", "doc", "docx"}

    # -------------------------------------------
    # INITIALIZE EXTENSIONS
    # -------------------------------------------
    db.init_app(app)
    jwt.init_app(app)

    # ✅ FIXED CORS (THIS SOLVES YOUR ERROR)
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:5173"],
    )

    # -------------------------------------------
    # REQUEST DEBUG LOGGER (KEPT)
    # -------------------------------------------
    from flask import request as _request

    @app.before_request
    def log_request_debug():
        try:
            print("\n----- REQUEST DEBUG START -----")
            print("METHOD:", _request.method)
            print("PATH:", _request.path)
            print("Content-Type:", _request.headers.get("Content-Type"))
            print("Authorization:", _request.headers.get("Authorization"))
            print("RAW BODY:", _request.get_data(as_text=True))
            print("PARSED JSON:", _request.get_json(silent=True))
            print("----- REQUEST DEBUG END -----\n")
        except Exception as e:
            print("DEBUG LOGGER ERROR:", e)

    # -------------------------------------------
    # REGISTER BLUEPRINTS
    # -------------------------------------------
    from app.routes.api import api_bp
    from app.routes.uploads import upload_bp

    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(upload_bp, url_prefix="/api/upload")

    # -------------------------------------------
    # ENSURE UPLOAD FOLDER EXISTS
    # -------------------------------------------
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # -------------------------------------------
    # CREATE DB TABLES
    # -------------------------------------------
    with app.app_context():
        db.create_all()

    return app
