# backend/verify_data.py
from app import create_app, db
from app.models import Job, Candidate
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("\n🔎 --- VERIFYING DATABASE STORAGE ---")

    # 1. Check Jobs
    print(f"\n📂 Checking JOBS table...")
    jobs = Job.query.all()
    if not jobs:
        print("   ❌ No Jobs found in DB.")
    for j in jobs:
        print(f"   🆔 Job ID: {j.id} | Title: {j.title}")
        print(f"      💰 Salary: {j.salary_range} (Should not be None)")
        print(f"      🧠 Skills: {j.required_skills} (Should not be None)")
        print("-" * 30)

    # 2. Check Candidates
    print(f"\n👤 Checking CANDIDATES table...")
    candidates = Candidate.query.all()
    if not candidates:
        print("   ❌ No Candidates found in DB.")
    for c in candidates:
        print(f"   🆔 ID: {c.id} | Name: {c.name}")
        print(f"      🧠 Skills: {c.skills} (Should not be None)")
        print(f"      📄 Resume: {c.resume_url}")
        print("-" * 30)

    print("\n✅ Verification Complete.")