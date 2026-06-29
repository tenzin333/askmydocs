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

class Source(BaseModel):
    page_number: Optional[int] = None
    content: str  # the chunk text used to ground the answer


class ChatResponse(BaseModel):
    answer: str
    session_id: UUID
    sources: Optional[list[Source]] = []  # chunks used to generate answer

# =====================
# Email 
# =====================   
    
class EmailRequest(BaseModel):
    """Request body for sending emails."""
    to: EmailStr
    subject: str
    message: str


class EmailResponse(BaseModel):
    """Response after sending email."""
    success: bool
    id: str