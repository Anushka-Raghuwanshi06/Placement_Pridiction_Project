from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import time

from app.config import settings
from app.database import engine, Base
from app.ml.seed_data import init_db_and_seed
from app.routers import (
    auth,
    student,
    prediction,
    faculty,
    admin,
    datasets,
    models,
    notifications,
    audit
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Campus Placement Prediction System API with ML Inference, RBAC, and Audit Trail",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: Initialize DB and seeds
@app.on_event("startup")
def on_startup():
    init_db_and_seed()

# Include all module routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(student.router, prefix=settings.API_V1_STR)
app.include_router(prediction.router, prefix=settings.API_V1_STR)
app.include_router(faculty.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)

# Mount uploads static directory for resume previews if needed
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "disclaimer": settings.ADVISORY_DISCLAIMER
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "disclaimer": settings.ADVISORY_DISCLAIMER
    }
