from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_conn
from app.schemas import UserCreate, UserResponse, Token
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# =====================
# REGISTER
# =====================
@router.post("/register", response_model=UserResponse)
async def create_user(body: UserCreate, conn=Depends(get_conn)):
    
    # 1. Check if email exists
    existing = await conn.fetchrow("""
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
    new_user = await conn.fetchrow("""
        INSERT INTO users (email, hashed_password)
        VALUES ($1, $2)
        RETURNING *
    """, body.email, hashed_password)

    return dict(new_user)


# =====================
# LOGIN
# =====================
@router.post("/login", response_model=Token)
async def login(body: UserCreate, conn=Depends(get_conn)):

    # 1. Find user by email
    user = await conn.fetchrow("""
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
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}