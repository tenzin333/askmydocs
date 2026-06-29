# AskMyDocs — Roadmap

A prioritized plan for fixing bugs and strengthening the core RAG/chat experience.
Items are grouped by phase; within each phase they're ordered by impact.

Status legend: 🔴 not started · 🟡 in progress · 🟢 done

> **Update (2026-06-29):** all backend-contained items are now done (🟢). Remaining
> 🔴 items require frontend work or new infrastructure/dependencies and are scoped
> out of the backend pass — see notes per item.

---

## Phase 0 — Critical bug fixes (ship immediately)

These are live correctness/security issues affecting users right now. All are small, contained edits.

| # | Item | File | Status |
|---|------|------|--------|
| 0.1 | Fix `status.HTTTP_401_UNAUTHORIZED` typo — invalid tokens return 500 instead of 401 | [dependencies.py](backend/app/dependencies.py) | 🟢 |
| 0.2 | Fix upload error handler: wrong `status=` kwarg + undefined `e`; stop swallowing real status codes | [documents.py](backend/app/routers/documents.py) | 🟢 |
| 0.3 | Reorder table creation so `users` exists before `password_resets` FK (fails on fresh DB) | [db.py](backend/app/database/db.py) | 🟢 |
| 0.4 | Guard `body.get("token").strip()` — 500s when token missing | [auth.py](backend/app/routers/auth.py) | 🟢 |
| 0.5 | Remove dead/wrong duplicate `create_document` (inserts non-existent `file_url` column) | [documents.py](backend/app/routers/documents.py) | 🟢 |

---

## Phase 1 — Security hardening

| # | Item | File | Status |
|---|------|------|--------|
| 1.1 | Remove `print(DATABASE_URL)` — leaks DB credentials to logs | [db.py](backend/app/database/db.py) | 🟢 |
| 1.2 | Strip all debug `print`s (esp. reset-token log) | chats.py, documents.py, auth.py, document.py, main.py | 🟢 |
| 1.3 | Enforce max upload size before reading file into memory (20 MB cap + empty-file reject) | [pdf.py](backend/app/services/pdf.py) | 🟢 |
| 1.4 | Add rate limiting on `/login`, `/register`, `/forgot-password` (e.g. slowapi) | auth.py | 🔴 *needs new dep + app-state limiter* |
| 1.5 | Add JWT refresh-token flow (currently 30-min hard expiry) | auth.py, dependencies.py | 🔴 *touches frontend auth flow* |

---

## Phase 2 — Core RAG & chat improvements (highest product impact)

The heart of the product. Ordered by user-visible impact.

### 2.1 — Conversation memory 🟢
**Done:** `ask` now loads the last 10 session messages and passes them to `generate_answer`, which injects a "CONVERSATION SO FAR" block and instructs the model to resolve follow-up references.
**Files:** [chats.py](backend/app/routers/chats.py), [embedding.py](backend/app/services/embedding.py)

### 2.2 — Smarter chunking + page metadata 🟢
**Done:** Sentence-aware splitter (`_split_text`) packs sentences up to the window instead of slicing mid-sentence; text is extracted per page (`extract_pages`) and chunks are page-tagged. Added `page_number` column to `chunks` with an `ALTER TABLE ... IF NOT EXISTS` migration for existing DBs.
**Files:** [pdf.py](backend/app/services/pdf.py), [document.py](backend/app/services/document.py), [db.py](backend/app/database/db.py)

### 2.3 — Streaming responses 🔴 *deferred — requires SSE wiring + frontend changes*
**Problem:** Answers arrive all-at-once after a long spinner.
**Plan:** Use Gemini `stream=True` + FastAPI `StreamingResponse`/SSE; update frontend chat to render tokens incrementally.
**Files:** [embedding.py](backend/app/services/embedding.py), chats.py, frontend chat components

### 2.4 — Relevance threshold on retrieval 🟢
**Done:** `search_similar_chunks` now selects the cosine distance and drops chunks beyond `SIMILARITY_DISTANCE_THRESHOLD` (0.6); off-topic questions return no matches → "No relevant content found."
**Files:** [document.py](backend/app/services/document.py)

### 2.5 — Real citations in responses 🟢
**Done (backend):** `/ask` returns structured `sources` (`{page_number, content}`) from the actual retrieved chunks via the new `Source` schema.
**Done (frontend):** **Fixed a bug where citations were random fake page numbers** (`Math.random()*48`) — the UI now renders real page numbers, dedups chunks from the same page, and shows the chunk text on hover.
**Files:** [chats.py](backend/app/routers/chats.py), [schemas.py](backend/app/schema/schemas.py), [page.tsx](frontend/app/chat/[id]/page.tsx), [MessageBubble.tsx](frontend/components/MessageBubble.tsx)

---

## Phase 3 — Upload pipeline robustness

### 3.1 — Async upload with status 🔴 *deferred — needs background worker + status polling UI*
**Problem:** Entire pipeline (S3 → extract → chunk → embed → save) runs inside the request; large PDFs time out with no progress feedback.
**Plan:** Background job + `status` column (`processing`/`ready`/`failed`); frontend polls.
**Files:** [documents.py](backend/app/routers/documents.py), [document.py](backend/app/services/document.py), db.py

### 3.2 — Transactional upload + cleanup 🟢
**Done:** `_persist_document` inserts the document row and all chunks inside one `conn.transaction()`; `process_upload` deletes the S3 object if any post-upload step fails.
**Files:** [document.py](backend/app/services/document.py)

### 3.3 — Batch chunk inserts 🟢
**Done:** Replaced the per-chunk loop with a single `conn.executemany` over all chunk records.
**Files:** [document.py](backend/app/services/document.py)

### 3.4 — Non-blocking Gemini calls 🟢
**Done:** `generate_answer`, query embedding, and batch embedding now run via `asyncio.to_thread`, freeing the event loop.
**Files:** [embedding.py](backend/app/services/embedding.py), [document.py](backend/app/services/document.py)

---

## Phase 4 — Feature completeness

| # | Item | Status |
|---|------|--------|
| 4.1 | Auto-generate session titles from first question (currently stuck on "New Chat") | 🟢 |
| 4.2 | Multi-document retrieval ("ask across all my docs") | 🔴 *new feature / API + UI* |
| 4.3 | Regenerate / retry answer | 🔴 *new endpoint + UI* |
| 4.4 | Better empty/short-PDF handling (reject when no chunks are produced) | 🟢 |

---

## Phase 5 — Quality & maintenance

| # | Item | Status |
|---|------|--------|
| 5.1 | Remove leftover dev file `checkModels.py` | 🟢 |
| 5.2 | Add tests (RAG pipeline, auth, upload) — none exist today | 🔴 *no test harness yet* |
| 5.3 | Replace deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)` | 🟢 |
| 5.4 | Guard chunking loop against `CHUNK_SIZE <= CHUNK_OVERLAP` infinite loop | 🟢 |
| 5.5 | Fix README env-file naming inconsistency (`.env.local.example` → `.env.local`) | 🟢 |

---

## Suggested execution order

1. **Phase 0** — stop the bleeding (small, safe, high-value).
2. **Phase 2.1 + 2.2 + 2.4** — biggest leaps in answer quality and "feels like a real chat."
3. **Phase 1** — security before any wider launch.
4. **Phase 3** — robustness once real/large PDFs are in play.
5. **Phase 2.3 / 2.5** — polish the experience.
6. **Phases 4 & 5** — feature breadth and long-term health.
