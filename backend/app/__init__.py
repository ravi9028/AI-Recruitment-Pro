# backend/app/__init__.py

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Initialize Extensions
db = SQLAlchemy()
mail = Mail()
jwt = JWTManager()


def create_app():
    # 1. Load Environment Variables
    load_dotenv()

    app = Flask(__name__)

    # -------------------------------------------
    # ✅ 2. APPLY CORS IMMEDIATELY (Priority Fix)
    # -------------------------------------------
    # We apply this first so even if DB fails, the frontend gets a response.
    CORS(app, resources={r"/*": {"origins": "*"}})

    # -------------------------------------------
    # 3. DATABASE CONFIG (With Error Checking)
    # -------------------------------------------
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("\n❌ CRITICAL ERROR: 'DATABASE_URL' is missing from your .env file!")
        print("Using temporary SQLite DB to prevent crash...\n")
        # Fallback to prevent crash so you can see the error
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///temp_fallback.db"
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # -------------------------------------------
    # 4. JWT & UPLOAD CONFIG
    # -------------------------------------------
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change_me")
    app.config["PROPAGATE_EXCEPTIONS"] = True

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100 MB
    app.config["ALLOWED_EXTENSIONS"] = {"pdf", "doc", "docx", "mp4", "webm"}

    # -------------------------------------------
    # 5. EMAIL CONFIG
    # -------------------------------------------
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('EMAIL_USER')
    app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASS')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('EMAIL_USER')

    # -------------------------------------------
    # 6. INITIALIZE APPS
    # -------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    # -------------------------------------------
    # 7. DEBUG LOGGER (Optional but helpful)
    # -------------------------------------------
    from flask import request as _request

    @app.before_request
    def log_request_debug():
        if _request.method == "OPTIONS":
            return  # Don't log preflight spam
        try:
            print(f"\n📨 [{_request.method}] {_request.path}")
        except Exception:
            pass

    # -------------------------------------------
    # 8. REGISTER BLUEPRINTS
    # -------------------------------------------
    # Import inside function to avoid circular import errors
    try:
        from app.routes.api import api_bp
        from app.routes.uploads import upload_bp

        app.register_blueprint(api_bp, url_prefix="/api")
        app.register_blueprint(upload_bp, url_prefix="/api/upload")
    except Exception as e:
        print(f"❌ Error importing Blueprints: {e}")

    # -------------------------------------------
    # 9. CREATE DB TABLES (With Crash Protection)
    # -------------------------------------------
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    with app.app_context():
        try:
            db.create_all()
            print("✅ Database Connected & Tables Created!")
        except Exception as e:
            print(f"❌ DATABASE CONNECTION FAILED: {e}")
            print("⚠️ The server is running, but database features will fail.")

    return app