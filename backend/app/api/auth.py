from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pyotp
from ..database.session import get_db
from ..models.user import User
from ..schemas.auth import UserCreate, UserOut, Token, MFAVerify
from ..auth.security import get_password_hash, verify_password, create_access_token, decode_access_token
from ..core.config import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
@limiter.limit("5/minute")
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_pw = get_password_hash(user_in.password)

    # Generate MFA secret for new users by default (National-Level Security)
    mfa_secret = pyotp.random_base32()

    new_user = User(
        username=user_in.username,
        hashed_password=hashed_pw,
        role=user_in.role,
        mfa_secret=mfa_secret,
        mfa_enabled=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/token", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked. Try again after {user.locked_until.strftime('%Y-%m-%d %H:%M:%S')} UTC",
        )

    if not verify_password(form_data.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1

        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=30)
            user.failed_login_attempts = 0 # Reset after locking

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login - reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    if user.mfa_enabled:
        # Issue a short-lived token that only allows MFA verification
        mfa_token = create_access_token(
            data={"sub": user.username, "role": user.role, "mfa_pending": True},
            expires_delta=timedelta(minutes=5)
        )
        return {"access_token": mfa_token, "token_type": "bearer"}

    # Fallback for users without MFA (not recommended for National-Level)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/mfa/verify", response_model=Token)
@limiter.limit("10/minute")
def verify_mfa(request: Request, mfa_data: MFAVerify, db: Session = Depends(get_db)):
    # Decode the mfa_pending token
    payload = decode_access_token(mfa_data.token)
    if not payload or not payload.get("mfa_pending"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired MFA pending token",
        )

    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify TOTP code
    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(mfa_data.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA code",
        )

    # Issue the final access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}
