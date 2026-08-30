import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Placement Prediction System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-placement-prediction-2026-jwt-token-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite / MySQL fallback support
    # Default is SQLite for zero-config portable execution, can be swapped via DATABASE_URL env var
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'placement_prediction.db'}")
    
    # Storage Paths
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    RESUME_DIR: Path = BASE_DIR / "uploads" / "resumes"
    DATASET_DIR: Path = BASE_DIR / "uploads" / "datasets"
    MODEL_DIR: Path = BASE_DIR / "models_storage"
    REPORTS_DIR: Path = BASE_DIR / "reports_storage"
    
    # Disclaimer
    ADVISORY_DISCLAIMER: str = "Predictions are advisory only and must not be presented as a placement guarantee anywhere in the UI or messaging."

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
for path in [settings.UPLOAD_DIR, settings.RESUME_DIR, settings.DATASET_DIR, settings.MODEL_DIR, settings.REPORTS_DIR]:
    path.mkdir(parents=True, exist_ok=True)
