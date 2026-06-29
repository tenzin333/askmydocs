from fastapi import FastAPI, Depends, status, HTTPException
from app.database import get_pool
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_pool)):
    try:
        payload = jwt.decode(token, SECRET_KEY,  algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
           raise HTTPException(
                status_code = status.HTTP_401_UNAUTHORIZED,
                detail = "Invalid token"
            )
        
        
    
    except JWTError:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid token"
        )
        
    user = await db.fetchrow("""
        SELECT * FROM users WHERE id = $1
    """, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return dict(user)
        
    

    