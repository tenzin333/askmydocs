from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_pool
from app.schema import UserCreate, UserResponse, Token
import bcrypt
from jose import jwt
import os
import secrets
from datetime import datetime, timedelta, timezone
from app.services.email import send_reset_email
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# =====================
# REGISTER
# =====================
@router.post("/register", response_model=UserResponse)
async def create_user(body: UserCreate, db=Depends(get_pool)):
    
    # 1. Check if email exists
    existing = await db.fetchrow("""
        SELECT * FROM users WHERE email = $1
    """, body.email)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. Hash password
    hashed_password = bcrypt.hashpw(
        body.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # 3. Insert user
    new_user = await db.fetchrow("""
        INSERT INTO users (email, hashed_password)
        VALUES ($1, $2)
        RETURNING *
    """, body.email, hashed_password)

    return dict(new_user)


# =====================
# LOGIN
# =====================
@router.post("/login", response_model=Token)
async def login(body: UserCreate, db=Depends(get_pool)):

    # 1. Find user by email
    user = await db.fetchrow("""
        SELECT * FROM users WHERE email = $1
    """, body.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 2. Check password
    password_match = bcrypt.checkpw(
        body.password.encode("utf-8"),
        user["hashed_password"].encode("utf-8")
    )

    if not password_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 3. Generate JWT token
    token_data = {
        "sub": str(user["id"]),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}


# =====================
# FORGOT PASSWORD
# =====================
@router.post("/forgot-password")
async def forgot_password(
    body: dict,
    db=Depends(get_pool)
):
    email = body.get("email")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )

    # Check user exists
    user = await db.fetchrow("""
        SELECT * FROM users WHERE email = $1
    """, email)

    # Always return success even if email not found
    # prevents email enumeration attacks
    if not user:
        return {"message": "If this email exists you will receive a reset link"}

    # Generate token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    # Delete any existing reset tokens for this user
    await db.execute("""
        DELETE FROM password_resets WHERE user_id = $1
    """, user["id"])

    # Save token
    await db.execute("""
        INSERT INTO password_resets (user_id, token, expires_at)
        VALUES ($1, $2, $3)
    """, user["id"], token, expires_at)

    # Send email
    send_reset_email(email, token)

    return {"message": "If this email exists you will receive a reset link"}


# =====================
# RESET PASSWORD
# =====================
@router.post("/reset-password")
async def reset_password(
    body: dict,
    db=Depends(get_pool)
):
    token = (body.get("token") or "").strip()
    new_password = body.get("new_password")

    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and new password are required"
        )

    # Find token
    reset = await db.fetchrow("""
        SELECT * FROM password_resets WHERE token = $1
    """, token)

    if not reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )

    # Check expiry
    if datetime.now(timezone.utc) > reset["expires_at"].replace(tzinfo=timezone.utc):
        await db.execute("""
            DELETE FROM password_resets WHERE token = $1
        """, token)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )

    # Hash new password
    hashed = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # Update password
    await db.execute("""
        UPDATE users SET hashed_password = $1 WHERE id = $2
    """, hashed, reset["user_id"])

    # Delete used token
    await db.execute("""
        DELETE FROM password_resets WHERE token = $1
    """, token)

    return {"message": "Password reset successfully"}