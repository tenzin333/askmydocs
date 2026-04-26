from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

# =====================
# USER SCHEMAS
# =====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# =====================
# AUTH SCHEMAS
# =====================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[UUID] = None

# =====================
# DOCUMENT SCHEMAS
# =====================

class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    file_path: str
    total_chunks: int
    created_at: datetime

    class Config:
        from_attributes = True

# =====================
# CHAT SESSION SCHEMAS
# =====================

class ChatSessionCreate(BaseModel):
    document_id: UUID
    title: Optional[str] = "New Chat"

class ChatSessionResponse(BaseModel):
    id: UUID
    document_id: UUID
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

# =====================
# MESSAGE SCHEMAS
# =====================

class MessageCreate(BaseModel):
    session_id: UUID
    role: str
    content: str

class MessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# =====================
# CHAT REQUEST SCHEMA
# =====================

class ChatRequest(BaseModel):
    session_id: UUID
    question: str

class ChatResponse(BaseModel):
    answer: str
    session_id: UUID
    sources: Optional[list[str]] = []  # chunks used to generate answer