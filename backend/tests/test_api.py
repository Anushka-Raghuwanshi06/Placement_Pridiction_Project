import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert "advisory" in response.json()["disclaimer"].lower()

def test_auth_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@college.edu",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_auth_login_student():
    response = client.post("/api/auth/login", json={
        "email": "student@college.edu",
        "password": "Student@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"

def test_student_prediction_flow():
    # 1. Login
    login_resp = client.post("/api/auth/login", json={
        "email": "student@college.edu",
        "password": "Student@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get student bundle
    bundle_resp = client.get("/api/student/bundle", headers=headers)
    assert bundle_resp.status_code == 200
    assert bundle_resp.json()["email"] == "student@college.edu"

    # 3. Trigger Prediction (< 3 seconds requirement)
    pred_resp = client.post("/api/prediction/predict", json={
        "cgpa": 8.9,
        "percentage": 87.0,
        "backlogs": 0,
        "aptitude_score": 90.0,
        "technical_skills": "Python, SQL, React, Data Structures, Git, AWS",
        "branch": "Computer Science & Engineering"
    }, headers=headers)

    assert pred_resp.status_code == 200
    pred_data = pred_resp.json()
    assert "probability" in pred_data
    assert pred_data["probability"] >= 0.0 and pred_data["probability"] <= 100.0
    assert "contributing_factors" in pred_data
    assert len(pred_data["contributing_factors"]) > 0
    assert "company_eligibility" in pred_data
    assert "disclaimer" in pred_data
    assert pred_data["latency_ms"] < 3000.0  # Non-functional requirement

def test_student_academic_validation():
    login_resp = client.post("/api/auth/login", json={
        "email": "student@college.edu",
        "password": "Student@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid CGPA (> 10)
    inv_cgpa = client.put("/api/student/academic", json={
        "cgpa": 12.5,
        "percentage": 80.0,
        "backlogs": 0,
        "aptitude_score": 75.0
    }, headers=headers)
    assert inv_cgpa.status_code == 422 or inv_cgpa.status_code == 400

    # Invalid Backlogs (< 0)
    inv_backlogs = client.put("/api/student/academic", json={
        "cgpa": 8.0,
        "percentage": 80.0,
        "backlogs": -2,
        "aptitude_score": 75.0
    }, headers=headers)
    assert inv_backlogs.status_code == 422 or inv_backlogs.status_code == 400

def test_faculty_monitoring_rbac():
    # Login as Faculty
    login_resp = client.post("/api/auth/login", json={
        "email": "faculty@college.edu",
        "password": "Faculty@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get Assigned Students
    resp = client.get("/api/faculty/students", headers=headers)
    assert resp.status_code == 200
    students = resp.json()
    assert isinstance(students, list)
    assert len(students) > 0

    # Get Faculty Overview
    overview_resp = client.get("/api/faculty/overview", headers=headers)
    assert overview_resp.status_code == 200
    assert "total_assigned" in overview_resp.json()

def test_admin_reports_and_exports():
    # Login as Admin
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@college.edu",
        "password": "Admin@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Stats
    stats_resp = client.get("/api/admin/stats", headers=headers)
    assert stats_resp.status_code == 200
    assert stats_resp.json()["total_students"] > 0

    # 2. Aggregate Report
    agg_resp = client.get("/api/admin/reports/aggregate", headers=headers)
    assert agg_resp.status_code == 200
    assert "branch_stats" in agg_resp.json()

    # 3. Export CSV
    csv_resp = client.get("/api/admin/reports/export/csv", headers=headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers.get("content-type", "")

    # 4. Export PDF
    pdf_resp = client.get("/api/admin/reports/export/pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.headers.get("content-type", "")

    # 5. Audit logs
    audit_resp = client.get("/api/audit/logs", headers=headers)
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()) > 0
