from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.student import StudentProfile, AcademicRecord, SkillResume
from app.schemas.auth import UserCreate, UserLogin, UserOut, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rbac import get_current_user
from app.core.audit import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Validate role
    role = user_in.role.lower()
    if role not in ["student", "faculty", "admin"]:
        role = "student"

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If student, initialize default profile and academic record
    if role == "student":
        prof = StudentProfile(user_id=new_user.user_id, branch="Computer Science & Engineering", semester=7)
        acad = AcademicRecord(user_id=new_user.user_id, cgpa=7.5, percentage=75.0, backlogs=0, aptitude_score=70.0)
        skills = SkillResume(user_id=new_user.user_id, technical_skills="Python, SQL, React, Git")
        db.add_all([prof, acad, skills])
        db.commit()

    log_audit_event(
        db=db,
        actor=new_user,
        action_type="USER_REGISTRATION",
        target_entity="user",
        target_id=str(new_user.user_id),
        details=f"User registered with role {new_user.role}",
        request=request
    )

    access_token = create_access_token(
        subject=new_user.email,
        role=new_user.role,
        user_id=new_user.user_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    log_audit_event(
        db=db,
        actor=user,
        action_type="USER_LOGIN",
        target_entity="auth",
        target_id=str(user.user_id),
        details=f"Successful login from IP",
        request=request
    )

    access_token = create_access_token(
        subject=user.email,
        role=user.role,
        user_id=user.user_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
