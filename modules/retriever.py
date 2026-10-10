from langchain_chroma import Chroma
from modules.embedding import embeddings

def get_retriever(vector_store=None, k: int = 4, collection_name='yt-vectors'):
    if vector_store is None:
        vector_store = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory="./chroma_db"
        )
        
    return vector_store.as_retriever(
        search_type='mmr',
        search_kwargs={'k': k, 'fetch_k': 10}
    )
