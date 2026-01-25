from app import create_app, db
from sqlalchemy import text, inspect

app = create_app()

with app.app_context():
    print("🔍 CHECKING DATABASE COLUMNS...")
    inspector = inspect(db.engine)

    # Check Job Table
    job_cols = [c['name'] for c in inspector.get_columns('job')]
    print(f"\n📂 Job Table Columns: {job_cols}")
    if 'salary_range' in job_cols:
        print("   ✅ salary_range: EXISTS")
    else:
        print("   ❌ salary_range: MISSING (Data will not save!)")

    if 'required_skills' in job_cols:
        print("   ✅ required_skills: EXISTS")

    # Check Candidate Table
    cand_cols = [c['name'] for c in inspector.get_columns('candidate')]
    print(f"\n👤 Candidate Table Columns: {cand_cols}")
    if 'skills' in cand_cols:
        print("   ✅ skills: EXISTS")

    print("\n-------------------------------------")