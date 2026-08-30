from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DatasetOut(BaseModel):
    dataset_id: int
    admin_id: int
    file_name: str
    file_size_bytes: int
    row_count: int
    status: str
    validation_notes: str
    upload_date: datetime

    class Config:
        from_attributes = True

class DatasetValidationResponse(BaseModel):
    is_valid: bool
    total_rows: int
    valid_rows: int
    invalid_rows: int
    detected_columns: List[str]
    missing_columns: List[str]
    sample_preview: List[Dict[str, Any]]
    message: str
