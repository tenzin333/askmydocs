import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import HTTPException, status
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
LLM_MODEL = "gemini-2.5-flash"  # ✅ fixed

genai.configure(api_key=GEMINI_API_KEY)


# =====================
# SINGLE EMBEDDING
# =====================
def generate_embedding(text: str) -> list[float]:  # ✅ sync
    response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768
    )
    return response["embedding"]


# =====================
# BATCH EMBEDDINGS
# =====================
def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    # ✅ parallel calls — much faster
    with ThreadPoolExecutor(max_workers=10) as executor:
        embeddings = list(executor.map(generate_embedding, chunks))
    return embeddings


# =====================
# QUERY EMBEDDING
# =====================
def generate_query_embedding(question: str) -> list[float]:
    response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=question,
        task_type="retrieval_query",
        output_dimensionality=768
    )
    return response["embedding"]


# =====================
# GENERATE ANSWER
# =====================
async def generate_answer(
    question: str,
    context_chunks: list[str],
    history: list[dict] | None = None,
) -> str:

    context = "\n\n".join(context_chunks)

    # Include recent conversation so follow-up questions keep their meaning.
    history_text = ""
    if history:
        lines = [
            f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
            for m in history
        ]
        history_text = (
            "CONVERSATION SO FAR:\n" + "\n".join(lines) + "\n\n"
        )

    prompt = f"""You are a helpful assistant that answers questions based on provided document context only.

            {history_text}CONTEXT:
            {context}

            QUESTION:
            {question}

            INSTRUCTIONS:
            - Answer based ONLY on the context provided
            - Use the conversation so far to resolve follow-up references (e.g. "it", "that")
            - If the answer is not in the context, say "I cannot find this information in the document"
            - Be concise and accurate
            - Do not make up information

            ANSWER:"""

    try:
        model = genai.GenerativeModel(LLM_MODEL)
        # SDK call is blocking → run off the event loop
        response = await asyncio.to_thread(model.generate_content, prompt)
        return response.text

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"LLM generation failed: {str(e)}"
        )