"""
Ava – Avatar AI Assistant · Backend
=====================================
Run: uvicorn main:app --reload --port 8000
"""

import os
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

# ── Load ENV ─────────────────────────────────────────
load_dotenv()

# ── Groq Client ──────────────────────────────────────
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# ── FastAPI App ──────────────────────────────────────
app = FastAPI(title="Ava – Avatar Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── System Prompt ────────────────────────────────────
SYSTEM_PROMPT = """
You are Ava, the friendly AI assistant for Avatar — an AI & Cyber Security training platform based in India.

ABOUT AVATAR:
- Premium AI and Cyber Security training for students, working professionals, and 45+ learners
- 5,000+ learners trained | 12+ industry mentors | 4.9/5 rating | 25+ live workshops
- New Delhi, India
- 20% OFF on all AI Workshops right now

PROGRAMS:
1. Cyber Security Training
2. AI Training for Students
3. AI for Professionals
4. AI for 45+ Learners

TONE:
Warm, concise, encouraging.
Keep replies under 120 words.
"""

# ── Models ───────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

class ChatResponse(BaseModel):
    reply: str

# ── Routes ───────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Ava backend is running ✅"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):

    if not req.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    try:

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            }
        ]

        # Add previous history
        for msg in req.history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add latest user message
        messages.append({
            "role": "user",
            "content": req.message
        })

        # ── Groq AI Call ─────────────────────────────
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        reply = response.choices[0].message.content

        return ChatResponse(
            reply=reply
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )