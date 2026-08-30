from sqlalchemy import Column, Integer, String, Float, Text
from app.database import Base

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    minimum_cgpa = Column(Float, default=7.0, nullable=False)
    backlog_allowed = Column(Integer, default=0, nullable=False)
    required_skills = Column(Text, default="Python, SQL, DSA, System Design", nullable=False)
    tier = Column(String(50), default="Tier 1")  # Tier 1, Tier 2, Tier 3 / Product, Service
    package_lpa = Column(Float, default=12.0)
    job_role = Column(String(255), default="Software Development Engineer")
