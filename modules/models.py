from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    video_url: str
    question: str
    language: Optional[str] = "auto"

class VideoInfoResponse(BaseModel):
    video_id: str
    collection_name: str
    is_indexed: bool
    chunk_count: int

class ChatResponse(BaseModel):
    status: str
    video_id: str
    question: str
    answer: str
    chunks_indexed: int

class VideoInfoRequest(BaseModel):
    video_url: str
