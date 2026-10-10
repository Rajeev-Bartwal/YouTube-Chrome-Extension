import os
from langchain_groq import ChatGroq
from fastapi import HTTPException

def get_Model():
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured in .env")

    model = ChatGroq(
        api_key=groq_api_key,
        model_name='openai/gpt-oss-120b',
    )

    return model