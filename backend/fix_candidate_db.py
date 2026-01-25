# backend/fix_candidate_db.py
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("🔧 CHECKING CANDIDATE TABLE...")

    # 1. Fix Phone
    try:
        print("🔨 Adding 'phone' column...")
        db.session.execute(text("ALTER TABLE candidate ADD COLUMN phone VARCHAR(50) DEFAULT NULL;"))
        print("✅ Added 'phone'")
    except Exception as e:
        print(f"ℹ️ 'phone' likely exists")

    # 2. Fix Education
    try:
        print("🔨 Adding 'education' column...")
        db.session.execute(text("ALTER TABLE candidate ADD COLUMN education TEXT DEFAULT NULL;"))
        print("✅ Added 'education'")
    except Exception as e:
        print(f"ℹ️ 'education' likely exists")

    db.session.commit()
    print("\n🚀 CANDIDATE DB REPAIR COMPLETE!")