from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("🔧 STARTING DATABASE SCHEMA FIX...")

    # 1. FIX JOB TABLE
    try:
        print("🔨 Checking 'job' table...")
        # Add salary_range if missing
        try:
            db.session.execute(text("ALTER TABLE job ADD COLUMN salary_range VARCHAR(100) DEFAULT NULL;"))
            print("   ✅ Added 'salary_range'")
        except:
            print("   ℹ️ 'salary_range' already exists")

        # Add jd_upload if missing
        try:
            db.session.execute(text("ALTER TABLE job ADD COLUMN jd_upload VARCHAR(200) DEFAULT NULL;"))
            print("   ✅ Added 'jd_upload'")
        except:
            print("   ℹ️ 'jd_upload' already exists")
    except Exception as e:
        print(f"⚠️ Job Table Error: {e}")

    db.session.commit()
    print("\n🚀 DATABASE SCHEMA REPAIR COMPLETE!")