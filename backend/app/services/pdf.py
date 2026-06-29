import fitz
import boto3
import os
import re
import uuid
from dotenv import load_dotenv
from fastapi import HTTPException, status

load_dotenv()

# =====================
# CONFIG
# =====================
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")

# =====================
# S3 CLIENT
# =====================
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)
# =====================
# VALIDATE FILE
# =====================
def validate_file(filename: str, content_type: str):
    ext = os.path.splitext(filename)[1].lower()

    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    if content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type"
        )

# =====================
# UPLOAD TO S3
# =====================
async def save_file_s3(file) -> tuple[str, str]:
    contents = await file.read()

    # reject empty or oversized uploads before touching S3 / memory
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {MAX_FILE_SIZE // (1024 * 1024)} MB limit"
        )

    # unique filename to avoid conflicts
    unique_filename = f"{uuid.uuid4()}_{file.filename}"

    s3_client.put_object(
        Bucket=AWS_BUCKET_NAME,
        Key=unique_filename,
        Body=contents,
        ContentType="application/pdf"
    )

    # S3 URL
    file_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"

    return unique_filename, file_url

# =====================
# DOWNLOAD FROM S3
# =====================
def download_from_s3(s3_key: str) -> bytes:
    response = s3_client.get_object(
        Bucket=AWS_BUCKET_NAME,
        Key=s3_key
    )
    return response["Body"].read()

# =====================
# DELETE FROM S3
# =====================
def delete_from_s3(s3_key: str):
    s3_client.delete_object(
        Bucket=AWS_BUCKET_NAME,
        Key=s3_key
    )

# =====================
# EXTRACT TEXT FROM PDF (per page)
# =====================
def extract_pages(pdf_bytes: bytes) -> list[str]:
    """Return the text of each page, preserving page order for citations."""
    # open from bytes — no local file needed
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = [page.get_text() for page in doc]
    doc.close()

    if not any(p.strip() for p in pages):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF appears to be scanned or image-based."
        )

    return pages

# =====================
# SPLIT INTO CHUNKS (sentence-aware, page-tagged)
# =====================
def _split_text(text: str, size: int, overlap: int) -> list[str]:
    """Pack sentences into chunks of up to `size` chars without splitting mid-sentence."""
    # guard against a non-advancing step (5.4)
    step = max(1, size - overlap)

    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        # a single sentence longer than the window: hard-split it
        if len(sentence) > size:
            if current:
                chunks.append(current)
                current = ""
            for i in range(0, len(sentence), step):
                piece = sentence[i:i + size]
                if piece.strip():
                    chunks.append(piece)
            continue

        if len(current) + len(sentence) + 1 <= size:
            current = f"{current} {sentence}".strip()
        else:
            if current:
                chunks.append(current)
            current = sentence

    if current:
        chunks.append(current)

    return chunks


def split_into_chunks(pages: list[str]) -> list[tuple[str, int]]:
    """Return (chunk_text, page_number) tuples. Chunks never span pages, so the
    page number is an accurate source reference."""
    result: list[tuple[str, int]] = []

    for page_number, page_text in enumerate(pages, start=1):
        if not page_text.strip():
            continue
        for chunk in _split_text(page_text, CHUNK_SIZE, CHUNK_OVERLAP):
            if chunk.strip():
                result.append((chunk, page_number))

    return result