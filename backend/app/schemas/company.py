from pydantic import BaseModel, Field
from typing import Optional, List

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2)
    minimum_cgpa: float = Field(..., ge=0.0, le=10.0)
    backlog_allowed: int = Field(0, ge=0)
    required_skills: str = Field(...)
    tier: str = Field(default="Tier 1")
    package_lpa: float = Field(default=10.0)
    job_role: str = Field(default="Software Engineer")

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    pass

class CompanyOut(CompanyBase):
    company_id: int

    class Config:
        from_attributes = True
