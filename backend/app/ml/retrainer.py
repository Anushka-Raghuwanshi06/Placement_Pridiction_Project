import uuid
import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.config import settings
from app.models.model_version import ModelVersion
from app.models.dataset import Dataset
from app.ml.pipeline import PlacementMLPipeline
from app.ml.service import invalidate_model_cache

def train_and_register_model(
    db: Session,
    dataset_path: str,
    algorithm: str = "RandomForest",
    version_label: Optional[str] = None
) -> Dict[str, Any]:
    # Read dataset
    if dataset_path.endswith(".csv"):
        df = pd.read_csv(dataset_path)
    elif dataset_path.endswith((".xlsx", ".xls")):
        df = pd.read_excel(dataset_path)
    else:
        raise ValueError("Unsupported file format. Please upload CSV or Excel.")

    # Validate columns
    required_cols = ["cgpa", "percentage", "backlogs", "aptitude_score", "technical_skills", "placed"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Dataset missing required column: {col}")

    # Generate version string
    now_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    v_name = version_label or f"v{now_str}_{algorithm.lower()}"

    # Train pipeline
    pipeline_obj = PlacementMLPipeline(algorithm=algorithm)
    trained_model, metrics = pipeline_obj.train_and_evaluate(df)

    # Save artifact to model directory
    artifact_filename = f"{v_name}.joblib"
    artifact_path = settings.MODEL_DIR / artifact_filename
    pipeline_obj.save_artifact(str(artifact_path))

    # Deactivate current active models
    db.query(ModelVersion).filter(ModelVersion.is_active == True).update({"is_active": False})

    # Register new model version
    new_model_version = ModelVersion(
        version_name=v_name,
        algorithm=algorithm,
        accuracy=metrics["accuracy"],
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1_score=metrics["f1_score"],
        is_active=True,
        artifact_path=str(artifact_path),
        features_list="cgpa,percentage,backlogs,aptitude_score,technical_skills",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_model_version)
    db.commit()
    db.refresh(new_model_version)

    # Invalidate cache so subsequent predictions immediately load this new model
    invalidate_model_cache()

    return {
        "model_id": new_model_version.model_id,
        "version_name": new_model_version.version_name,
        "algorithm": new_model_version.algorithm,
        "metrics": metrics,
        "is_active": True,
        "artifact_path": str(artifact_path)
    }

def activate_existing_model(db: Session, model_id: int) -> ModelVersion:
    target_model = db.query(ModelVersion).filter(ModelVersion.model_id == model_id).first()
    if not target_model:
        raise ValueError("Model version not found.")

    # Deactivate all others
    db.query(ModelVersion).filter(ModelVersion.is_active == True).update({"is_active": False})
    target_model.is_active = True
    db.commit()
    db.refresh(target_model)

    invalidate_model_cache()
    return target_model
