from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from uuid import UUID
from app.database import get_pool
from app.schema import DocumentResponse
from app.dependencies import get_current_user
from app.services.document import (
    process_upload,
    get_user_documents,
    get_document,
    delete_document
)
from app.services.pdf import delete_from_s3

router = APIRouter(prefix="/api/documents", tags=["documents"])


async def create_document(
    conn,
    user_id: UUID,
    filename: str,
    s3_key: str,
    file_url: str,
    total_chunks: int
) -> dict:
    document = await conn.fetchrow("""
        INSERT INTO documents (user_id, filename, s3_key, file_url, total_chunks)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    """, user_id, filename, s3_key, file_url, total_chunks)

    return dict(document)


# =====================
# SAVE CHUNKS TO DB
# =====================
async def save_chunks(
    conn,
    document_id: UUID,
    chunks: list[str],
    embeddings: list[list[float]]
):
    for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        await conn.execute("""
            INSERT INTO chunks (document_id, content, embedding, chunk_index)
            VALUES ($1, $2, $3, $4)
        """, document_id, chunk, embedding, index)
        

@router.get("/", response_model=list[DocumentResponse])
async def all_docs(
    conn=Depends(get_conn),
    current_user=Depends(get_current_user)
):
    docs = await get_user_documents(conn, current_user["id"])
    return docs


@router.get("/{id}", response_model=DocumentResponse)
async def docs(id: str, db = Depends(get_pool), current_user = Depends(get_current_user)):
    doc = await db.fetchrow(
        """
            SELECT * FROM documents WHERE id = $1
        """, id
        )

    # 1. Check if doc exists
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # 2. Check if doc belongs to current user
    if doc["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document"
        )

    return dict(doc)



@router.post("/upload" , response_model = DocumentResponse)
async def upload_doc( file, db = Depends(get_pool), current_user = Depends(get_current_user)):
    try:
        document  = await process_upload(
            db = db,
            user_id = current_user,
            file = file
        )
        
        return document
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = f"Upload failed : {str(e)}"
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_doc(
    id: UUID,
    conn=Depends(get_pool),
    current_user=Depends(get_current_user)
):
    # 1. Get document
    doc = await get_document(conn, id)

    # 2. Check exists
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 3. Check ownership
    if doc["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this document"
        )

    # 4. Delete from S3
    delete_from_s3(doc["s3_key"])

    # 5. Delete from DB (cascades to chunks + sessions + messages)
    await delete_document(conn, id)

