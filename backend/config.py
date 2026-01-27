import os


class Config:
    # 1. Standard Settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'recruit-pro-secret-key-2026'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///recruitpro.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 2. File Upload Paths
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'app/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    # 3. 🟢 EMAIL CONFIGURATION (Port 587 Fix)
    MAIL_SERVER = 'smtp.gmail.com'

    # CHANGE TO PORT 587 (Fixes "Wrong Version Number" error)
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False

    # 👇 PASTE YOUR CREDENTIALS HERE DIRECTLY
    MAIL_USERNAME = "recruitpro.demo.2026@gmail.com"  # <--- Your Bot Email
    MAIL_PASSWORD = "abcd efgh ijkl mnop"  # <--- Your 16-digit App Password

    MAIL_DEFAULT_SENDER = MAIL_USERNAME