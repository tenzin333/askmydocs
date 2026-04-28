import asyncpg
import os
from dotenv import load_dotenv

load_dotenv() 

DATABASE_URL = os.getenv("DATABASE_URL")
print(DATABASE_URL)
pool = None

async def get_pool():
    global pool
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable is required to connect to the database.")
    if not pool:
        pool = await asyncpg.create_pool(DATABASE_URL)
    return pool


async def create_tables():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE EXTENSION IF NOT EXISTS vector;
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                s3_key VARCHAR(255) NOT NULL, 
                file_path VARCHAR(255) NOT NULL,
                total_chunks INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS chunks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                embedding VECTOR(768),
                chunk_index INT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS chunks_embeddings_idx
            ON chunks USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);

            CREATE TABLE IF NOT EXISTS chat_sessions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                title VARCHAR(255) DEFAULT 'New Chat',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
            CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
            CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_document_id ON chat_sessions(document_id);
            """        )    