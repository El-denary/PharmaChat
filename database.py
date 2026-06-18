from sqlalchemy import create_engine, Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Database_URL = "postgresql://postgres:12345678@localhost:5432/medicine_assistant"

engine = create_engine(Database_URL)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    title = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String(10), nullable=False)
    text = Column(Text, nullable=True)
    image_path = Column(String(255), nullable=True)  # ← new
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()