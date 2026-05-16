from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import seed_fake_data
from agent import run_agent
import redis
import os
import json
from datetime import datetime

# Initialize Redis Client
redis_client = None
try:
    if os.getenv("REDIS_URI"):
        redis_client = redis.Redis.from_url(os.getenv("REDIS_URI"), decode_responses=True)
except Exception as e:
    print(f"Failed to connect to Redis: {e}")

app = FastAPI(title="UPI AI Support Agent API")

# Allow requests from the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.on_event("startup")
async def startup_event():
    # Seed the DB on startup
    await seed_fake_data()

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        reply_text = run_agent(request.message)
        
        # Log to Redis to demonstrate state memory!
        if redis_client:
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "user_message": request.message,
                "ai_reply": reply_text
            }
            # Push to a Redis list named 'chat_history'
            redis_client.lpush("chat_history", json.dumps(log_entry))
            # Keep only the last 100 messages to save space
            redis_client.ltrim("chat_history", 0, 99)
            
        return ChatResponse(reply=reply_text)
    except Exception as e:
        return ChatResponse(reply=f"Sorry, I encountered an error: {str(e)}")

@app.get("/")
def read_root():
    return {"status": "UPI Support API is running"}
