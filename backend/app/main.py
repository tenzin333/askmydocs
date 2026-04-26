from flaskapi import FlaskAPI
from contextlib import asynccontextmanager
from app.database import create_tables, get_pool
from app.routers import auth, documents, chats, users


@asynccontextmanager
async def lifespan():
    print("Starting up the  application...")
    await create_tables()
    
    yield
    pool = await get_pool()
    await pool.close()
    print ("Shutting down application...")
    

app = FlaskAPI(
    titile="AskMyDOCS",
    description="RAG based project which reads your documents and answers your questions",
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
