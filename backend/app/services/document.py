import asyncio
from uuid import UUID
from fastapi import HTTPException, status
from app.services.pdf import (
    validate_file,
    save_file_s3,
    download_from_s3,
    delete_from_s3,
    extract_pages,
    split_into_chunks
)
from app.services.embedding import (
    generate_embeddings,
    generate_query_embedding
)

# Maximum cosine distance (0 = identical, 2 = opposite) for a chunk to count as
# relevant. Beyond this the document almost certainly does not answer the query.
SIMILARITY_DISTANCE_THRESHOLD = 0.6

# =====================
# PERSIST DOCUMENT + CHUNKS (transactional)
# =====================
async def _persist_document(
    conn,
    user_id: UUID,
    filename: str,
    s3_key: str,
    file_path: str,
    chunk_tuples: list[tuple[str, int]],
    embeddings: list[list[float]],
) -> dict:
    """Insert the document row and all chunks atomically inside one transaction."""
    async with conn.transaction():
        document = await conn.fetchrow("""
            INSERT INTO documents (user_id, filename, s3_key, file_path, total_chunks)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, user_id, filename, s3_key, file_path, len(chunk_tuples))

        records = [
            (document["id"], chunk, str(embedding), index, page_number)
            for index, ((chunk, page_number), embedding)
            in enumerate(zip(chunk_tuples, embeddings))
        ]

        # single round-trip batch insert instead of one query per chunk
        await conn.executemany("""
            INSERT INTO chunks (document_id, content, embedding, chunk_index, page_number)
            VALUES ($1, $2, $3, $4, $5)
        """, records)

    return dict(document)


# =====================
# FULL UPLOAD PIPELINE
# =====================
async def process_upload(db, user_id: UUID, file) -> dict:
    # 1. Validate file
    validate_file(file.filename, file.content_type)

    # 2. Upload to S3
    s3_key, file_path = await save_file_s3(file)

    # Everything after the upload can fail; clean up the S3 object if it does.
    try:
        # 3. Download from S3 → get bytes
        pdf_bytes = download_from_s3(s3_key)

        # 4. Extract text per page
        pages = extract_pages(pdf_bytes)

        # 5. Split into page-tagged chunks
        chunk_tuples = split_into_chunks(pages)

        if not chunk_tuples:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No readable text could be extracted from this PDF."
            )

        # 6. Generate embeddings (sync SDK → run off the event loop)
        chunk_texts = [chunk for chunk, _ in chunk_tuples]
        embeddings = await asyncio.to_thread(generate_embeddings, chunk_texts)

        # 7. Save document + chunks atomically
        async with db.acquire() as conn:
            document = await _persist_document(
                conn=conn,
                user_id=user_id,
                filename=file.filename,
                s3_key=s3_key,
                file_path=file_path,
                chunk_tuples=chunk_tuples,
                embeddings=embeddings,
            )

        return document

    except Exception:
        # avoid orphaned S3 objects when processing fails
        try:
            delete_from_s3(s3_key)
        except Exception:
            pass
        raise


# =====================
# SEARCH SIMILAR CHUNKS
# =====================
async def search_similar_chunks(
    db,
    document_id: UUID,
    question: str,
    limit: int = 5
) -> list[dict]:

    # 1. Generate query embedding (sync SDK → run off the event loop)
    query_embedding = await asyncio.to_thread(generate_query_embedding, question)

    # 2. Search pgvector for similar chunks, keeping only relevant ones
    rows = await db.fetch("""
        SELECT content, page_number, embedding <=> $2 AS distance
        FROM chunks
        WHERE document_id = $1
        ORDER BY distance
        LIMIT $3
    """, document_id, str(query_embedding), limit)

    return [
        {"content": row["content"], "page_number": row["page_number"]}
        for row in rows
        if row["distance"] <= SIMILARITY_DISTANCE_THRESHOLD
    ]


# =====================
# DELETE DOCUMENT
# =====================
async def delete_document(db, document_id: UUID) -> dict:
    document = await db.fetchrow("""
        DELETE FROM documents
        WHERE id = $1
        RETURNING *
    """, document_id)

    return dict(document)


# =====================
# GET ALL DOCUMENTS
# =====================
async def get_user_documents(db, user_id: UUID) -> list[dict]:
    rows = await db.fetch("""
        SELECT * FROM documents
        WHERE user_id = $1
        ORDER BY created_at DESC
    """, user_id)

    return [dict(row) for row in rows]


# =====================
# GET ONE DOCUMENT
# =====================
async def get_document(db, document_id: UUID) -> dict | None:
    row = await db.fetchrow("""
        SELECT * FROM documents
        WHERE id = $1
    """, document_id)

    return dict(row) if row else None