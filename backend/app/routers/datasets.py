import os
import shutil
from pathlib import Path
from typing import List
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetOut, DatasetValidationResponse
from app.core.rbac import require_role
from app.core.audit import log_audit_event

router = APIRouter(prefix="/datasets", tags=["Dataset Management (Admin)"])

REQUIRED_COLUMNS = ["cgpa", "percentage", "backlogs", "aptitude_score", "technical_skills", "placed"]

@router.post("/upload", response_model=DatasetValidationResponse)
def upload_and_validate_dataset(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Only .csv and .xlsx files are supported."
        )

    # Save to dataset upload directory
    safe_filename = f"dataset_{int(os.path.getmtime(settings.DATASET_DIR) if os.path.exists(settings.DATASET_DIR) else 100)}_{file.filename}"
    file_path = settings.DATASET_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Load and validate
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Normalize column names
    col_map = {c: c.strip().lower().replace(" ", "_") for c in df.columns}
    df.rename(columns=col_map, inplace=True)

    detected_cols = list(df.columns)
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in detected_cols]

    if missing_cols:
        # Create rejected dataset record
        dataset_record = Dataset(
            admin_id=current_user.user_id,
            file_name=file.filename,
            file_path=str(file_path),
            file_size_bytes=os.path.getsize(file_path),
            row_count=len(df),
            status="rejected",
            validation_notes=f"Missing required columns: {', '.join(missing_cols)}"
        )
        db.add(dataset_record)
        db.commit()

        log_audit_event(
            db=db,
            actor=current_user,
            action_type="DATASET_VALIDATION_FAILED",
            target_entity="dataset",
            target_id=str(dataset_record.dataset_id),
            details=f"Uploaded malformed dataset {file.filename}: missing {missing_cols}",
            request=request
        )

        return {
            "is_valid": False,
            "total_rows": len(df),
            "valid_rows": 0,
            "invalid_rows": len(df),
            "detected_columns": detected_cols,
            "missing_columns": missing_cols,
            "sample_preview": [],
            "message": f"Dataset rejected! Missing required columns: {', '.join(missing_cols)}"
        }

    # Data quality check
    # CGPA between 0 and 10, backlogs >= 0, placed in [0, 1]
    valid_mask = (
        (df["cgpa"] >= 0.0) & (df["cgpa"] <= 10.0) &
        (df["backlogs"] >= 0) &
        (df["placed"].isin([0, 1]))
    )
    valid_count = int(valid_mask.sum())
    invalid_count = len(df) - valid_count

    # Overwrite clean standardized csv
    df.to_csv(file_path, index=False)

    dataset_record = Dataset(
        admin_id=current_user.user_id,
        file_name=file.filename,
        file_path=str(file_path),
        file_size_bytes=os.path.getsize(file_path),
        row_count=len(df),
        status="validated",
        validation_notes=f"Schema verified. {valid_count} valid rows, {invalid_count} invalid rows."
    )
    db.add(dataset_record)
    db.commit()
    db.refresh(dataset_record)

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="DATASET_UPLOAD_SUCCESS",
        target_entity="dataset",
        target_id=str(dataset_record.dataset_id),
        details=f"Uploaded valid dataset {file.filename} with {len(df)} records.",
        request=request
    )

    preview_rows = df.head(5).fillna("").to_dict(orient="records")

    return {
        "is_valid": True,
        "total_rows": len(df),
        "valid_rows": valid_count,
        "invalid_rows": invalid_count,
        "detected_columns": detected_cols,
        "missing_columns": [],
        "sample_preview": preview_rows,
        "message": f"Dataset validated successfully! {valid_count} rows ready for model training."
    }

@router.get("/list", response_model=List[DatasetOut])
def list_datasets(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(Dataset).order_by(Dataset.upload_date.desc()).all()

@router.get("/{dataset_id}/preview")
def preview_dataset(
    dataset_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not ds or not os.path.exists(ds.file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found")

    df = pd.read_csv(ds.file_path) if ds.file_path.endswith(".csv") else pd.read_excel(ds.file_path)
    return {
        "dataset_id": ds.dataset_id,
        "file_name": ds.file_name,
        "total_rows": len(df),
        "columns": list(df.columns),
        "preview": df.head(10).fillna("").to_dict(orient="records")
    }

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.dataset_id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        if os.path.exists(ds.file_path):
            os.remove(ds.file_path)
    except Exception:
        pass

    db.delete(ds)
    db.commit()

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="DATASET_DELETED",
        target_entity="dataset",
        target_id=str(dataset_id),
        details=f"Deleted dataset {ds.file_name}",
        request=request
    )
    return {"message": "Dataset deleted successfully."}
