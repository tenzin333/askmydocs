import os
import google.generativeai as genai
from fastapi import HTTPException, status


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
LLM_MODEL = "gemini-2.5.flash"


genai.configure(api_key=GEMINI_API_KEY)

async def generate_embedding(text: str) -> list[float]:
    response = await genai.embed_content(
        model = EMBEDDING_MODEL,
        content = text,
        task_type = "retriveal_document"
    )
    
    return response["embedding"]


def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    embeddings = []

    for chunk in chunks:
        embedding = generate_embedding(chunk)
        embeddings.append(embedding)

    return embeddings

def generate_query_embedding(question: str) -> list[float]:
    response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=question,
        task_type="retrieval_query"  
    )
    return response["embedding"]


async def generate_answer(question: str, context_chunks: list[str]) -> str:
    
    content = "\n\n".join(context_chunks)
    
    prompt = f"""
       system: You are a helpful assistant that answers questions based on provided document context only.
       
        CONTEXT: 
            {content}
        
        QUESTION:
            {question}
        
        INSTRUCTIONS:
        - Answer based ONLY on the context provided
        - If the answer is not in the context, say "I cannot find this information in the document"
        - Be concise and accurate
        - Do not make up information
        
        ANSWER:
    """
    
    try:
        model = genai.GenerativeModel(LLM_MODEL)
        response = model.generate_content(prompt)
        
        return response.text
    
    except Exception as e:
        raise HTTPException(
            status_code = status.HTTP_503_SERVICEC_UNAVAILABLE,
            detail = f"LLM generation failed: {str(e)}"
        )
    

