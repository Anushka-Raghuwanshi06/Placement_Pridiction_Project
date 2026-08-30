from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.model_version import ModelVersion
from app.models.dataset import Dataset
from app.schemas.admin import ModelVersionOut
from app.core.rbac import require_role
from app.core.audit import log_audit_event
from app.ml.retrainer import train_and_register_model, activate_existing_model

router = APIRouter(prefix="/models", tags=["Model Versioning & Retraining"])

class RetrainRequest(BaseModel):
    dataset_id: Optional[int] = None
    algorithm: str = "RandomForest"  # RandomForest, GradientBoosting, LogisticRegression
    version_label: Optional[str] = None

@router.get("/list", response_model=List[ModelVersionOut])
def list_model_versions(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()

@router.post("/retrain")
def retrain_model(
    retrain_in: RetrainRequest,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    # Determine dataset path
    dataset_path = None
    if retrain_in.dataset_id:
        ds = db.query(Dataset).filter(Dataset.dataset_id == retrain_in.dataset_id).first()
        if not ds or ds.status != "validated":
            raise HTTPException(status_code=400, detail="Invalid or non-validated dataset ID.")
        dataset_path = ds.file_path
    else:
        # Use latest validated dataset or default
        ds = db.query(Dataset).filter(Dataset.status == "validated").order_by(Dataset.upload_date.desc()).first()
        if ds:
            dataset_path = ds.file_path
        else:
            default_path = settings.DATASET_DIR / "campus_placement_master_v1.csv"
            dataset_path = str(default_path)

    try:
        result = train_and_register_model(
            db=db,
            dataset_path=dataset_path,
            algorithm=retrain_in.algorithm,
            version_label=retrain_in.version_label
        )

        log_audit_event(
            db=db,
            actor=current_user,
            action_type="MODEL_RETRAIN_SUCCESS",
            target_entity="model_version",
            target_id=str(result["model_id"]),
            details=f"Retrained {result['version_name']} ({result['algorithm']}) - Acc: {result['metrics']['accuracy']}, F1: {result['metrics']['f1_score']}",
            request=request
        )

        return {
            "success": True,
            "message": f"Model {result['version_name']} successfully retrained and set as active with zero downtime!",
            "data": result
        }
    except Exception as e:
        log_audit_event(
            db=db,
            actor=current_user,
            action_type="MODEL_RETRAIN_FAILED",
            target_entity="model_version",
            details=f"Retraining failed: {str(e)}",
            request=request
        )
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")

@router.post("/{model_id}/activate", response_model=ModelVersionOut)
def activate_model(
    model_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    try:
        model = activate_existing_model(db, model_id)

        log_audit_event(
            db=db,
            actor=current_user,
            action_type="MODEL_ACTIVATED",
            target_entity="model_version",
            target_id=str(model_id),
            details=f"Activated model version {model.version_name}",
            request=request
        )

        return model
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
