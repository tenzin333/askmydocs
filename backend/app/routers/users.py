from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_pool
from app.dependencies import get_current_user
from app.schema import UserResponse
import bcrypt

router = APIRouter(prefix="/api/users", tags=["users"])


# =====================
# GET MY PROFILE
# =====================
@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user=Depends(get_current_user)
):
    # current_user already fetched in dependency
    return current_user


# =====================
# UPDATE MY PROFILE
# =====================
@router.put("/me", response_model=UserResponse)
async def update_me(
    body: dict,
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    # Only allow email update for now
    new_email = body.get("email")

    if not new_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )

    # Check email not already taken
    existing = await db.fetchrow("""
        SELECT * FROM users WHERE email = $1
        AND id != $2
    """, new_email, current_user["id"])

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )

    # Update email
    updated_user = await db.fetchrow("""
        UPDATE users
        SET email = $1
        WHERE id = $2
        RETURNING *
    """, new_email, current_user["id"])

    return dict(updated_user)


# =====================
# CHANGE PASSWORD
# =====================
@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    body: dict,
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    old_password = body.get("old_password")
    new_password = body.get("new_password")

    if not old_password or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both old and new password required"
        )

    # 1. Verify old password
    password_match = bcrypt.checkpw(
        old_password.encode("utf-8"),
        current_user["hashed_password"].encode("utf-8")
    )

    if not password_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Old password is incorrect"
        )

    # 2. Hash new password
    new_hashed = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # 3. Update password
    await db.execute("""
        UPDATE users
        SET hashed_password = $1
        WHERE id = $2
    """, new_hashed, current_user["id"])

    return {"message": "Password updated successfully"}


# =====================
# DELETE MY ACCOUNT
# =====================
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    # CASCADE deletes all documents, chunks,
    # sessions and messages automatically
    await db.execute("""
        DELETE FROM users WHERE id = $1
    """, current_user["id"])