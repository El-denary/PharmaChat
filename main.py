from fastapi import FastAPI, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import base64
import uuid
import os
import shutil

from langchain_core.messages import HumanMessage, AIMessage
from workflow import Workflow
from state import State
from database import Base, engine, get_db, Conversation, Message
from agents import generate_title

Base.metadata.create_all(bind=engine)

# Create uploads folder if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

# Serve uploads folder as static
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: Optional[str] = None
    image_base64: Optional[str] = None
    conversation_id: Optional[int] = None


workflow = Workflow()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/conversation")
def create_conversation(db: Session = Depends(get_db)):
    conversation = Conversation(user_id=None)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return {"conversation_id": conversation.id}


@app.get("/conversations")
def get_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).order_by(
        Conversation.created_at.desc()
    ).all()
    return {
        "conversations": [
            {
                "id": c.id,
                "title": c.title or f"Consultation #{c.id}",
                "created_at": str(c.created_at)
            }
            for c in conversations
        ]
    }


@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    # Delete image files from disk first
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.image_path != None
    ).all()

    for msg in messages:
        if msg.image_path:
            # Extract filename from path and delete file
            filename = msg.image_path.split("/uploads/")[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)

    # Delete conversation (messages cascade automatically)
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if conversation:
        db.delete(conversation)
        db.commit()
        return {"success": True}

    return {"success": False, "error": "Conversation not found"}


@app.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).all()
    return {
        "messages": [
            {
                "role": m.role,
                "text": m.text,
                "image_path": m.image_path  # ← return image path
            }
            for m in messages
        ]
    }


@app.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    image_bytes = None
    image_path = None

    # Save image to disk if provided
    if request.image_base64:
        image_bytes = base64.b64decode(request.image_base64)
        filename = f"{uuid.uuid4().hex}.jpg"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        image_path = f"http://localhost:8000/uploads/{filename}"

    # Load history from database
    lc_messages = []
    past_messages = []
    if request.conversation_id:
        past_messages = db.query(Message).filter(
            Message.conversation_id == request.conversation_id
        ).order_by(Message.created_at).all()

        for msg in past_messages:
            if msg.role == "user":
                lc_messages.append(HumanMessage(content=msg.text or ""))
            elif msg.role == "bot":
                lc_messages.append(AIMessage(content=msg.text or ""))

    is_first_message = len(past_messages) == 0

    # Run the AI pipeline
    initial_state = State(
        query=request.query,
        image=image_bytes,
        messages=lc_messages,
        content=None,
        rewritten_query=None,
        response=None
    )

    result = workflow.run(initial_state)
    response = result.get("response")

    # Save messages to database
    if request.conversation_id:
        if request.query or image_path:
            db.add(Message(
                conversation_id=request.conversation_id,
                role="user",
                text=request.query,
                image_path=image_path  # ← save image path
            ))
        if response:
            db.add(Message(
                conversation_id=request.conversation_id,
                role="bot",
                text=response
            ))
        db.commit()

        # Generate title on first message
        if is_first_message and request.query:
            title = generate_title(request.query)
            conversation = db.query(Conversation).filter(
                Conversation.id == request.conversation_id
            ).first()
            if conversation:
                conversation.title = title
                db.commit()

    return {"response": response}

from fastapi.responses import FileResponse

@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    return FileResponse("frontend/dist/index.html")