from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class StudentSummaryForFaculty(BaseModel):
    assignment_id: int
    student_id: int
    name: str
    email: str
    branch: str
    semester: int
    cgpa: float
    backlogs: int
    aptitude_score: float
    technical_skills: str
    latest_probability: Optional[float] = None
    readiness_level: Optional[str] = "Not Calculated"
    risk_status: str
    mentor_notes: Optional[str] = None
    assigned_date: datetime

class AssignStudentRequest(BaseModel):
    faculty_id: int
    student_ids: List[int]

class UpdateFacultyNoteRequest(BaseModel):
    mentor_notes: str
    risk_status: Optional[str] = "Normal"
