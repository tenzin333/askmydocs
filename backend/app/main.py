from app.routers import auth, documents
from app.routers import chats
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import create_tables, get_pool
from app.routers import users
from dotenv import load_dotenv

load_dotenv() 


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up the application...")
    await create_tables()
    
    yield
    pool = await get_pool()
    await pool.close()
    print("Shutting down application...")
    
    
app = FastAPI(
    title="AskMyDOCS",
    version="0.1.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    return { "status":'ok', "service":"AskMyDOCS"}


app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chats.router)
app.include_router(users.router)
