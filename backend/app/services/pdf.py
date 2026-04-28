import fitz
import boto3
import os
import uuid
from dotenv import load_dotenv
from fastapi import HTTPException, status

load_dotenv()

# =====================
# CONFIG
# =====================
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

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
# EXTRACT TEXT FROM PDF
# =====================
def extract_text(pdf_bytes: bytes) -> str:
    # open from bytes — no local file needed
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""

    for page in doc:
        text = page.get_text()
        full_text += text

    doc.close()

    if not full_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF appears to be scanned or image-based."
        )

    return full_text

# =====================
# SPLIT INTO CHUNKS
# =====================
def split_into_chunks(text: str) -> list[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]

        if chunk.strip():
            chunks.append(chunk)

        start = end - CHUNK_OVERLAP

    return chunks