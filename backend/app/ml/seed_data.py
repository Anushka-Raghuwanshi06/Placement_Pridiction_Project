import os
import random
from pathlib import Path
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.student import StudentProfile, AcademicRecord, SkillResume
from app.models.company import Company
from app.models.prediction import Prediction
from app.models.dataset import Dataset
from app.models.faculty import FacultyStudentAssignment
from app.models.model_version import ModelVersion
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.ml.retrainer import train_and_register_model

SKILL_SETS = [
    "Python, SQL, React, Data Structures, Git, Docker",
    "Java, Spring Boot, MySQL, REST APIs, Microservices, DSA",
    "C++, Data Structures, Algorithms, System Design, Linux, Git",
    "Python, Machine Learning, Pandas, Scikit-learn, SQL, PowerBI",
    "HTML, CSS, JavaScript, React, Node.js, Express, MongoDB",
    "AWS, Python, Terraform, Docker, Kubernetes, CI/CD",
    "Java, SQL, HTML, CSS, Problem Solving",
    "Python, Django, PostgreSQL, Git",
    "C, C++, Embedded Systems, RTOS, Linux",
    "SQL, Excel, Tableau, Python, Data Analytics"
]

BRANCHES = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Artificial Intelligence & Data Science",
    "Electrical Engineering"
]

COMPANIES_SEED = [
    {
        "name": "Google",
        "minimum_cgpa": 8.5,
        "backlog_allowed": 0,
        "required_skills": "C++, Java, Python, Data Structures, Algorithms, System Design",
        "tier": "Tier 1 (Product)",
        "package_lpa": 32.0,
        "job_role": "Software Development Engineer"
    },
    {
        "name": "Microsoft",
        "minimum_cgpa": 8.0,
        "backlog_allowed": 0,
        "required_skills": "Data Structures, Algorithms, C++, Java, Azure, System Design",
        "tier": "Tier 1 (Product)",
        "package_lpa": 28.0,
        "job_role": "Software Engineer"
    },
    {
        "name": "Amazon",
        "minimum_cgpa": 7.8,
        "backlog_allowed": 0,
        "required_skills": "Java, Python, Data Structures, AWS, OOP, System Design",
        "tier": "Tier 1 (Product)",
        "package_lpa": 24.5,
        "job_role": "SDE I"
    },
    {
        "name": "Cisco",
        "minimum_cgpa": 7.5,
        "backlog_allowed": 0,
        "required_skills": "Python, Linux, Networking, C++, Docker, Git",
        "tier": "Tier 1 (Product)",
        "package_lpa": 18.0,
        "job_role": "Network Software Engineer"
    },
    {
        "name": "Deloitte",
        "minimum_cgpa": 7.0,
        "backlog_allowed": 1,
        "required_skills": "Python, SQL, PowerBI, Tableau, Data Analytics, Communication",
        "tier": "Tier 2 (Consulting)",
        "package_lpa": 11.5,
        "job_role": "Tech Analyst"
    },
    {
        "name": "TCS Digital",
        "minimum_cgpa": 7.0,
        "backlog_allowed": 0,
        "required_skills": "Python, Java, SQL, Cloud, Data Structures",
        "tier": "Tier 2 (Service/Digital)",
        "package_lpa": 7.5,
        "job_role": "Digital Software Engineer"
    },
    {
        "name": "Infosys Power Programmer",
        "minimum_cgpa": 6.8,
        "backlog_allowed": 1,
        "required_skills": "Java, Python, Algorithms, Full Stack, SQL",
        "tier": "Tier 2 (Service/Specialist)",
        "package_lpa": 9.0,
        "job_role": "Specialist Programmer"
    },
    {
        "name": "Accenture",
        "minimum_cgpa": 6.5,
        "backlog_allowed": 1,
        "required_skills": "Java, SQL, Problem Solving, Communication, Cloud Basics",
        "tier": "Tier 3 (Service)",
        "package_lpa": 5.0,
        "job_role": "Associate Software Engineer"
    }
]

def generate_synthetic_dataset(num_samples: int = 1200) -> pd.DataFrame:
    np.random.seed(42)
    random.seed(42)

    data = []
    for i in range(num_samples):
        # Generate realistic distributions
        cgpa = round(np.random.normal(7.4, 1.1), 2)
        cgpa = max(5.0, min(9.95, cgpa))
        
        percentage = round(cgpa * 9.5 + np.random.normal(0, 2), 1)
        percentage = max(50.0, min(98.0, percentage))

        # Backlogs: skewed towards 0
        backlog_prob = random.random()
        if backlog_prob < 0.72:
            backlogs = 0
        elif backlog_prob < 0.88:
            backlogs = 1
        elif backlog_prob < 0.96:
            backlogs = 2
        else:
            backlogs = random.randint(3, 5)

        # Aptitude score
        aptitude = round(np.random.normal(68.0, 14.0), 1)
        aptitude = max(30.0, min(99.0, aptitude))

        skills = random.choice(SKILL_SETS)
        branch = random.choice(BRANCHES)

        # Realistic placement probability formula
        skills_boost = 15.0 if ("Data Structures" in skills or "DSA" in skills) else 0.0
        tech_boost = 10.0 if ("Python" in skills or "Java" in skills) else 0.0
        backlog_penalty = backlogs * 30.0

        placement_score = (cgpa * 8.5) + (aptitude * 0.45) + skills_boost + tech_boost - backlog_penalty - 45.0
        placement_prob = 1.0 / (1.0 + np.exp(-placement_score / 15.0))
        
        placed = 1 if (np.random.random() < placement_prob and backlogs <= 1 and cgpa >= 6.0) else 0

        data.append({
            "student_id": f"STU{1000 + i}",
            "branch": branch,
            "cgpa": cgpa,
            "percentage": percentage,
            "backlogs": backlogs,
            "aptitude_score": aptitude,
            "technical_skills": skills,
            "placed": placed
        })

    return pd.DataFrame(data)

def init_db_and_seed():
    # 1. Create all tables
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        admin_exists = db.query(User).filter(User.email == "admin@college.edu").first()
        if admin_exists:
            print("Database already initialized and seeded.")
            return

        print("Seeding fresh database with initial demo users, companies, dataset, and model...")

        # 2. Seed Admin
        admin_user = User(
            name="System Administrator",
            email="admin@college.edu",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN.value
        )
        db.add(admin_user)
        db.flush()

        # 3. Seed Faculty
        faculty_user = User(
            name="Dr. Arvind Sharma (Dean Placements)",
            email="faculty@college.edu",
            password_hash=get_password_hash("Faculty@123"),
            role=UserRole.FACULTY.value
        )
        faculty_user2 = User(
            name="Prof. Sunita Rao (Placement Mentor)",
            email="sunita.rao@college.edu",
            password_hash=get_password_hash("Faculty@123"),
            role=UserRole.FACULTY.value
        )
        db.add_all([faculty_user, faculty_user2])
        db.flush()

        # 4. Seed Companies
        for comp_data in COMPANIES_SEED:
            comp = Company(**comp_data)
            db.add(comp)
        db.flush()

        # 5. Generate and Save Baseline Dataset
        dataset_df = generate_synthetic_dataset(1200)
        dataset_filename = "campus_placement_master_v1.csv"
        dataset_filepath = settings.DATASET_DIR / dataset_filename
        dataset_df.to_csv(dataset_filepath, index=False)

        dataset_record = Dataset(
            admin_id=admin_user.user_id,
            file_name=dataset_filename,
            file_path=str(dataset_filepath),
            file_size_bytes=os.path.getsize(dataset_filepath),
            row_count=len(dataset_df),
            status="validated",
            validation_notes="Verified 1,200 rows with 6 feature dimensions."
        )
        db.add(dataset_record)
        db.flush()

        # 6. Train and register initial Active Model (v1.0-RandomForest)
        print("Training baseline ML model artifact...")
        train_and_register_model(
            db=db,
            dataset_path=str(dataset_filepath),
            algorithm="RandomForest",
            version_label="v1.0-RandomForest"
        )

        # 7. Seed Students
        students_seed = [
            {
                "name": "Anushka Sharma",
                "email": "student@college.edu",
                "password": "Student@123",
                "branch": "Computer Science & Engineering",
                "semester": 7,
                "phone": "+91 98765 43210",
                "cgpa": 8.85,
                "percentage": 86.5,
                "backlogs": 0,
                "aptitude_score": 88.0,
                "skills": "Python, SQL, React, Data Structures, Git, Docker, System Design",
                "certs": "AWS Certified Cloud Practitioner, Meta Front-End Developer",
                "mentor": faculty_user.user_id,
                "risk": "Normal"
            },
            {
                "name": "Rohit Verma",
                "email": "rohit@college.edu",
                "password": "Student@123",
                "branch": "Information Technology",
                "semester": 7,
                "phone": "+91 98765 43211",
                "cgpa": 7.2,
                "percentage": 71.0,
                "backlogs": 1,
                "aptitude_score": 64.0,
                "skills": "Java, SQL, HTML, CSS, Problem Solving",
                "certs": "Oracle Certified Associate Java",
                "mentor": faculty_user.user_id,
                "risk": "At Risk"
            },
            {
                "name": "Priya Nair",
                "email": "priya@college.edu",
                "password": "Student@123",
                "branch": "Artificial Intelligence & Data Science",
                "semester": 7,
                "phone": "+91 98765 43212",
                "cgpa": 9.3,
                "percentage": 91.2,
                "backlogs": 0,
                "aptitude_score": 94.0,
                "skills": "Python, Machine Learning, Pandas, Scikit-learn, SQL, PowerBI, Deep Learning",
                "certs": "TensorFlow Developer Certificate, Azure AI Engineer",
                "mentor": faculty_user.user_id,
                "risk": "Normal"
            },
            {
                "name": "Vikram Malhotra",
                "email": "vikram@college.edu",
                "password": "Student@123",
                "branch": "Electronics & Communication",
                "semester": 7,
                "phone": "+91 98765 43213",
                "cgpa": 6.1,
                "percentage": 60.5,
                "backlogs": 2,
                "aptitude_score": 52.0,
                "skills": "C, C++, Embedded Systems, Basic SQL",
                "certs": "Embedded C Mastery",
                "mentor": faculty_user2.user_id,
                "risk": "High Attention"
            },
            {
                "name": "Sneha Patel",
                "email": "sneha@college.edu",
                "password": "Student@123",
                "branch": "Computer Science & Engineering",
                "semester": 7,
                "phone": "+91 98765 43214",
                "cgpa": 7.9,
                "percentage": 78.0,
                "backlogs": 0,
                "aptitude_score": 76.0,
                "skills": "JavaScript, React, Node.js, Express, MongoDB, Git",
                "certs": "Full Stack Web Development - Coursera",
                "mentor": faculty_user.user_id,
                "risk": "Normal"
            }
        ]

        for s_data in students_seed:
            s_user = User(
                name=s_data["name"],
                email=s_data["email"],
                password_hash=get_password_hash(s_data["password"]),
                role=UserRole.STUDENT.value
            )
            db.add(s_user)
            db.flush()

            # Profile
            s_prof = StudentProfile(
                user_id=s_user.user_id,
                branch=s_data["branch"],
                semester=s_data["semester"],
                phone=s_data["phone"],
                date_of_birth="2003-05-15"
            )
            db.add(s_prof)

            # Academic
            s_acad = AcademicRecord(
                user_id=s_user.user_id,
                cgpa=s_data["cgpa"],
                percentage=s_data["percentage"],
                backlogs=s_data["backlogs"],
                aptitude_score=s_data["aptitude_score"]
            )
            db.add(s_acad)

            # Skills
            s_skills = SkillResume(
                user_id=s_user.user_id,
                technical_skills=s_data["skills"],
                certifications=s_data["certs"]
            )
            db.add(s_skills)

            # Faculty assignment
            f_assign = FacultyStudentAssignment(
                faculty_id=s_data["mentor"],
                student_id=s_user.user_id,
                risk_status=s_data["risk"],
                mentor_notes=f"Initial counseling completed. Track progress in mock tests."
            )
            db.add(f_assign)

            # Initial Notification
            notif = Notification(
                user_id=s_user.user_id,
                title="Welcome to Campus Placement Portal",
                message="Please complete your academic and skill profile to generate your real-time placement readiness score.",
                type="system"
            )
            db.add(notif)

        # 8. Add initial Audit Log
        audit = AuditLog(
            actor_id=admin_user.user_id,
            actor_email=admin_user.email,
            actor_role=admin_user.role,
            action_type="SYSTEM_INITIALIZATION",
            target_entity="system",
            details="Seeded initial database tables, companies, default users, dataset, and trained v1.0-RandomForest model."
        )
        db.add(audit)

        db.commit()
        print("Database successfully seeded!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db_and_seed()
