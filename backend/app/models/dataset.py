from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from app.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    dataset_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    row_count = Column(Integer, default=0)
    status = Column(String(50), default="validated")  # validated, rejected, processing, active_training
    validation_notes = Column(String(500), default="Schema matches expected features")
    upload_date = Column(DateTime, default=datetime.utcnow)
