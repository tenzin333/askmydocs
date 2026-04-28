# AskMyDocs

**Chat with your PDF documents using AI.** Upload a PDF, ask questions in plain English, and get precise answers grounded in the document's content — powered by Google Gemini and vector search.

---

## Features

- **PDF Upload & Processing** — drag-and-drop or click to upload; text is automatically extracted and chunked
- **Semantic Search** — embeddings stored in PostgreSQL with pgvector; retrieves the most relevant passages per question
- **RAG-powered Answers** — top matching chunks are passed to Gemini 2.5 Flash, which generates a grounded, cited response
- **Conversation History** — every session is persisted; pick up any previous conversation from the sidebar
- **Document Library** — manage multiple PDFs from a single dashboard
- **Secure Auth** — JWT tokens in httpOnly cookies; all data is scoped per user

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| Backend | FastAPI, Python 3.12, Uvicorn |
| Database | PostgreSQL (Neon) + pgvector |
| AI / Embeddings | Google Gemini 2.5 Flash · `gemini-embedding-001` (768d) |
| File Storage | AWS S3 |
| Auth | JWT (python-jose) + bcrypt |
| PDF Parsing | PyMuPDF |

---

## Architecture

```
Browser
  │
  ▼
Next.js (App Router)
  │  ├─ /app/api/*   ← thin proxy layer (handles cookies, forwards to FastAPI)
  │  ├─ /dashboard   ← document library
  │  └─ /chat/[id]   ← chat interface
  │
  ▼ HTTP
FastAPI
  │  ├─ /api/auth        ← register · login
  │  ├─ /api/documents   ← upload · list · delete
  │  ├─ /api/chat        ← sessions · RAG ask
  │  └─ /api/users       ← profile management
  │
  ├──▶ PostgreSQL (Neon)
  │       ├─ users
  │       ├─ documents
  │       ├─ chunks  ←─ VECTOR(768) + IVFFlat index
  │       ├─ chat_sessions
  │       └─ messages
  │
  ├──▶ AWS S3  ← raw PDF storage
  └──▶ Google Gemini API  ← embeddings + LLM
```

### RAG Pipeline

```
User question
     │
     ▼
Gemini Embedding API  →  768-dim query vector
     │
     ▼
pgvector similarity search  →  top-5 chunks
     │
     ▼
Gemini 2.5 Flash (context + question)  →  grounded answer
     │
     ▼
Answer + source references saved to messages table
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python 3.12
- A PostgreSQL database with the `pgvector` extension enabled (e.g. [Neon](https://neon.tech))
- Google Gemini API key — [get one here](https://aistudio.google.com/app/apikey)
- AWS S3 bucket with read/write permissions

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ask_my_docs.git
cd ask_my_docs
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your environment file
cp .env.example .env
# Fill in the values — see Environment Variables below

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs at `http://localhost:8000/docs`.

> **Database tables** are created automatically on first startup — no migrations needed.

---

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Create your environment file
cp .env.local.example .env
# Set API_URL if your backend is not on localhost:8000

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend — `backend/.env`

```env
# PostgreSQL connection string (must have pgvector extension enabled)
DATABASE_URL=postgresql://user:password@host/dbname

# Secret key for signing JWT tokens — use a long random string
SECRET_KEY=your-secret-key-here

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
EMBEDDING_MODEL=models/gemini-embedding-001

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=eu-north-1
```

### Frontend — `frontend/.env.local`

```env
# URL of the FastAPI backend (defaults to http://localhost:8000 if not set)
API_URL=http://localhost:8000
```

---

## Project Structure

```
ask_my_docs/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app + lifespan (DB init)
│   │   ├── dependencies.py       # JWT auth dependency
│   │   ├── database/
│   │   │   └── db.py             # Connection pool + table creation
│   │   ├── routers/
│   │   │   ├── auth.py           # /api/auth
│   │   │   ├── documents.py      # /api/documents
│   │   │   ├── chats.py          # /api/chat
│   │   │   └── users.py          # /api/users
│   │   ├── services/
│   │   │   ├── document.py       # Chunking + embedding pipeline
│   │   │   ├── embedding.py      # Gemini embedding + LLM calls
│   │   │   └── pdf.py            # PDF text extraction + S3 upload
│   │   └── schema/
│   │       └── schemas.py        # Pydantic request/response models
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/
    ├── app/
    │   ├── api/                  # Next.js route handlers (proxy to FastAPI)
    │   │   ├── auth/
    │   │   ├── chat/
    │   │   ├── documents/
    │   │   └── users/
    │   ├── dashboard/            # Document library page
    │   ├── chat/[id]/            # Chat interface page
    │   ├── login/
    │   └── layout.tsx
    ├── components/
    │   ├── DashboardClient.tsx
    │   ├── ChatSidebar.tsx
    │   ├── ChatHeader.tsx
    │   ├── MessageBubble.tsx
    │   ├── ChatInput.tsx
    │   ├── EmptyChat.tsx
    │   └── TypingIndicator.tsx
    └── lib/
        ├── clientFetch.ts        # Authenticated fetch (client-side)
        ├── serverFetch.ts        # Authenticated fetch (server-side)
        └── session.ts            # JWT cookie helpers
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Sign in, returns JWT token |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents/` | List all documents for the authenticated user |
| `GET` | `/api/documents/{id}` | Get a single document |
| `POST` | `/api/documents/upload` | Upload and process a PDF |
| `DELETE` | `/api/documents/{id}` | Delete a document and all related data |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/session` | Create a new chat session for a document |
| `GET` | `/api/chat/sessions` | List sessions (filter by `?document_id=`) |
| `GET` | `/api/chat/session/{id}` | Get session + full message history |
| `POST` | `/api/chat/ask` | Send a question, get a RAG-powered answer |
| `DELETE` | `/api/chat/session/{id}` | Delete session and all its messages |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/me` | Get current user profile |
| `PUT` | `/api/users/me` | Update email |
| `PUT` | `/api/users/me/password` | Change password |
| `DELETE` | `/api/users/me` | Delete account and all associated data |

---

## Database Schema

```sql
users         (id, email, hashed_password, created_at)
documents     (id, user_id, filename, s3_key, file_path, total_chunks, created_at)
chunks        (id, document_id, content, embedding VECTOR(768), chunk_index, created_at)
chat_sessions (id, document_id, title, created_at)
messages      (id, session_id, role, content, created_at)
```

Chunks use an **IVFFlat index** on the `embedding` column for fast approximate nearest-neighbour search.

---

## PDF Limitations

- Text-based PDFs only — scanned or image-only PDFs will produce empty or poor results
- Maximum practical size is around 100–200 pages (processing time scales with chunk count)
- Only `.pdf` files are accepted at upload

---

## License

MIT
