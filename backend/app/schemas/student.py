from pydantic import BaseModel, Field, validator
from typing import Optional, List

class StudentProfileBase(BaseModel):
    branch: str = Field(..., min_length=2, max_length=100)
    semester: int = Field(..., ge=1, le=8)
    phone: Optional[str] = Field(None, max_length=30)
    date_of_birth: Optional[str] = Field(None, max_length=50)

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileUpdate(StudentProfileBase):
    pass

class StudentProfileOut(StudentProfileBase):
    profile_id: int
    user_id: int

    class Config:
        from_attributes = True


class AcademicRecordBase(BaseModel):
    cgpa: float = Field(..., ge=0.0, le=10.0, description="CGPA must be between 0.0 and 10.0")
    percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage must be between 0.0 and 100.0")
    backlogs: int = Field(..., ge=0, description="Backlog count cannot be negative")
    aptitude_score: float = Field(..., ge=0.0, le=100.0, description="Aptitude score must be between 0 and 100")

class AcademicRecordCreate(AcademicRecordBase):
    pass

class AcademicRecordUpdate(AcademicRecordBase):
    pass

class AcademicRecordOut(AcademicRecordBase):
    record_id: int
    user_id: int

    class Config:
        from_attributes = True


class SkillResumeBase(BaseModel):
    technical_skills: str = Field(..., min_length=2, description="Comma-separated skills")
    certifications: Optional[str] = ""
    resume_path: Optional[str] = None

class SkillResumeCreate(SkillResumeBase):
    pass

class SkillResumeUpdate(SkillResumeBase):
    pass

class SkillResumeOut(SkillResumeBase):
    skill_resume_id: int
    user_id: int

    class Config:
        from_attributes = True


class FullStudentBundle(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    profile: Optional[StudentProfileOut] = None
    academic: Optional[AcademicRecordOut] = None
    skills: Optional[SkillResumeOut] = None
    latest_prediction: Optional[dict] = None
