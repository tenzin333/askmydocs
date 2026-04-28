from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from app.database import get_pool
from app.dependencies import get_current_user
from app.schema import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatRequest,
    ChatResponse,
    MessageResponse
)
from app.services.document import (
    get_document,
    search_similar_chunks
)
from app.services.embedding import generate_answer

router = APIRouter(prefix="/api/chat", tags=["chat"])


# =====================
# CREATE SESSION
# =====================
@router.post("/session", response_model=ChatSessionResponse)
async def create_session(
    body: ChatSessionCreate,
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    # 1. Check document exists and belongs to user
    doc = await get_document(db, body.document_id)

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if doc["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # 2. Create session
    session = await db.fetchrow("""
        INSERT INTO chat_sessions (document_id, title)
        VALUES ($1, $2)
        RETURNING *
    """, body.document_id, body.title)
    
    return dict(session)


# =====================
# GET ALL SESSIONS
# =====================
@router.get("/sessions", response_model=list[ChatSessionResponse])
async def get_sessions(
    document_id: str = None,
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    print("l", document_id, current_user["id"])
    if document_id:
        sessions = await db.fetch("""
            SELECT cs.*
            FROM chat_sessions cs
            JOIN documents d on cs.document_id = d.id
            WHERE d.user_id = $1 AND cs.document_id = $2
            ORDER BY cs.created_at DESC                    
        """, current_user["id"], UUID(document_id))
    else:
        sessions = await db.fetch("""
            SELECT cs.*
            FROM chat_sessions cs
            JOIN documents d ON cs.document_id = d.id
            WHERE d.user_id = $1
            ORDER BY cs.created_at DESC
        """, current_user["id"])

    return [dict(s) for s in sessions]


# =====================
# GET ONE SESSION + MESSAGES
# =====================
@router.get("/session/{id}", response_model=dict)
async def get_session(
    id: UUID,
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    # 1. Get session
    session = await db.fetchrow("""
        SELECT cs.*
        FROM chat_sessions cs
        JOIN documents d ON cs.document_id = d.id
        WHERE cs.id = $1 AND d.user_id = $2
    """, id, current_user["id"])

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # 2. Get messages
    messages = await db.fetch("""
        SELECT * FROM messages
        WHERE session_id = $1
        ORDER BY created_at ASC
    """, id)
    
    document = await db.fetchrow("""
        SELECT * FROM documents
        WHERE id = $1
    """, session["document_id"])
  
    return {
        "session": dict(session),
        "messages": [dict(m) for m in messages],
        "document": dict(document) if document else None 
    }

# =====================
#  RAG
# =====================
@router.post("/ask", response_model=ChatResponse)
async def ask(
    body: ChatRequest,
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    # 1. Get session
    session = await db.fetchrow("""
        SELECT cs.*
        FROM chat_sessions cs
        JOIN documents d ON cs.document_id = d.id
        WHERE cs.id = $1 AND d.user_id = $2
    """, body.session_id, current_user["id"])

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # 2. Search similar chunks from pgvector
    context_chunks = await search_similar_chunks(
        db=db,
        document_id=session["document_id"],
        question=body.question
    )

    if not context_chunks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No relevant content found in document"
        )

    # 3. Generate answer using Gemini
    answer = await generate_answer(
        question=body.question,
        context_chunks=context_chunks
    )

    # 4. Save user message to DB
    await db.execute("""
        INSERT INTO messages (session_id, role, content)
        VALUES ($1, $2, $3)
    """, body.session_id, "user", body.question)

    # 5. Save AI answer to DB
    await db.execute("""
        INSERT INTO messages (session_id, role, content)
        VALUES ($1, $2, $3)
    """, body.session_id, "assistant", answer)

    return {
        "answer": answer,
        "session_id": body.session_id,
        "sources": context_chunks  # chunks used to generate answer
    }


# =====================
# DELETE SESSION
# =====================
@router.delete("/session/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    id: UUID,
    db=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    # 1. Check session exists and belongs to user
    session = await db.fetchrow("""
        SELECT cs.*
        FROM chat_sessions cs
        JOIN documents d ON cs.document_id = d.id
        WHERE cs.id = $1 AND d.user_id = $2
    """, id, current_user["id"])

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # 2. Delete session (cascades to messages)
    await db.execute("""
        DELETE FROM chat_sessions WHERE id = $1
    """, id)