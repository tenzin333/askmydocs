from uuid import UUID
from app.services.pdf import (
    validate_file,
    save_file_s3,
    download_from_s3,
    extract_text,
    split_into_chunks
)
from app.services.embedding import (
    generate_embeddings,
    generate_query_embedding
)

# =====================
# SAVE DOCUMENT TO DB
# =====================
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


# =====================
# FULL UPLOAD PIPELINE
# =====================
async def process_upload(conn, user_id: UUID, file) -> dict:

    # 1. Validate file
    validate_file(file.filename, file.content_type)

    # 2. Upload to S3
    s3_key, file_url = await save_file_s3(file)

    # 3. Download from S3 → get bytes
    pdf_bytes = download_from_s3(s3_key)

    # 4. Extract text
    text = extract_text(pdf_bytes)

    # 5. Split into chunks
    chunks = split_into_chunks(text)

    # 6. Generate embeddings
    embeddings = generate_embeddings(chunks)

    # 7. Save document to DB
    document = await create_document(
        conn=conn,
        user_id=user_id,
        filename=file.filename,
        s3_key=s3_key,
        file_url=file_url,
        total_chunks=len(chunks)
    )

    # 8. Save chunks + embeddings to DB
    await save_chunks(
        conn=conn,
        document_id=document["id"],
        chunks=chunks,
        embeddings=embeddings
    )

    return document


# =====================
# SEARCH SIMILAR CHUNKS
# =====================
async def search_similar_chunks(
    conn,
    document_id: UUID,
    question: str,
    limit: int = 5
) -> list[str]:

    # 1. Generate query embedding
    query_embedding = generate_query_embedding(question)

    # 2. Search pgvector for similar chunks
    rows = await conn.fetch("""
        SELECT content
        FROM chunks
        WHERE document_id = $1
        ORDER BY embedding <=> $2
        LIMIT $3
    """, document_id, query_embedding, limit)

    return [row["content"] for row in rows]


# =====================
# DELETE DOCUMENT
# =====================
async def delete_document(conn, document_id: UUID) -> dict:
    document = await conn.fetchrow("""
        DELETE FROM documents
        WHERE id = $1
        RETURNING *
    """, document_id)

    return dict(document)


# =====================
# GET ALL DOCUMENTS
# =====================
async def get_user_documents(conn, user_id: UUID) -> list[dict]:
    rows = await conn.fetch("""
        SELECT * FROM documents
        WHERE user_id = $1
        ORDER BY created_at DESC
    """, user_id)

    return [dict(row) for row in rows]


# =====================
# GET ONE DOCUMENT
# =====================
async def get_document(conn, document_id: UUID) -> dict | None:
    row = await conn.fetchrow("""
        SELECT * FROM documents
        WHERE id = $1
    """, document_id)

    return dict(row) if row else None