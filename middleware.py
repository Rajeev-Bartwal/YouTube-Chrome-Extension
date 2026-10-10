import re
from modules.embedding import embeddings
from modules.splitter import split_text_chunks

from langchain_chroma import Chroma
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url_or_id: str) -> str:
    url_or_id = url_or_id.strip()

    patterns = [
        r'(?:v=|\/v\/|embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]

    for pettern in patterns:
        
        match = re.search(patterns , url_or_id)
        
        if match :
            return match.group(1)
    return url_or_id


# For creating a good vector collection name for a perticular vedio
def get_collection_name(video_id: str) -> str:
    
    clean_id = re.sub(r'[^a-zA-Z0-9]', '_', video_id)
    return f"yt_{clean_id}"[:63]

def get_transcript_for_video(video_id: str) -> str:
    yt_api = YouTubeTranscriptApi()

    try:
        transcript = yt_api.fetch(video_id , languages=['en' , 'hi'])
        return " ".join(chunk.text for chunk in transcript)

    except Exception:

        # Fallback to any transcript available
        try:
            transcript_list = yt_api.list(video_id)
            for t in transcript_list:
                transcript_obj = t.fetch()
                return " ".join(chunk.text for chunk in transcript_obj)
        except Exception as e:
            raise RuntimeError(f"Could not fetch transcript for video '{video_id}': {str(e)}")


def get_embeddings(video_id : str):

    collection_name = get_collection_name(video_id)
    vector_store = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )

    if vector_store._collection.count() == 0:
        
        transcript = get_transcript_for_video(video_id)

        if not transcript.strip():
            raise ValueError("Transcript is empty.")

        chunks = split_text_chunks(transcript)
        vector_store.add_documents(chunks)

        return vector_store

    return vector_store


    


    