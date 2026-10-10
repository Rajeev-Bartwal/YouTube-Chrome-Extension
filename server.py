from langchain_core.output_parsers import StrOutputParser
from middleware import get_collection_name
from middleware import extract_video_id
from fastapi import status
from fastapi import FastAPI,HTTPException,Request,Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from modules.models import ChatRequest,VideoInfoResponse , ChatResponse , VideoInfoRequest 
from modules.embedding import embeddings
from middleware import extract_video_id , get_collection_name , get_embeddings 
from modules.retriever import get_retriever
from modules.llm import get_Model

from langchain_chroma import Chroma
from langchain_core.runnables import RunnableParallel , RunnablePassthrough 
from langchain_core.output_parsers import StrOutputParser
from modules.promptTemplate import prompt



# For Swagger.
app = FastAPI(
    title='Youtube-Video-Q-and-A-Extension',
    description='Backend API for Youtube Video Q and A Extension',
    version='1.0.0'
)


cors = CORSMiddleware(
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(cors)

@app.get('/health' , status_code=status.HTTP_200_OK)
def health_check():
    return {
        'status':'OK',
        'service':'Youtube-Video-Q-and-A-Extension is up and running!'
    }

@app.get('/video/info')
def get_video_info(req : VideoInfoRequest):

    video_id = extract_video_id(req.video_url)
    collection_name = get_collection_name(video_id)

    store = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )
    count = store._collection.count()
    return VideoInfoResponse(
        video_id=video_id,
        collection_name=collection_name,
        is_indexed=count > 0,
        chunk_count=count
    )
    
    
@app.post('/api/chat')
def chat(req : ChatRequest):
    video_url = req.video_url.strip()
    que = req.question.strip()
    if not video_url:
        raise HTTPException(status_code=400, detail="Video ID cannot be empty.")
    if not que:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    video_id = extract_video_id(video_url)

    # 1. Retrieve or index vector store
    try:
        vector_store = get_embeddings(video_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transcript extraction or indexing error: {str(e)}")

    # 2. Build Retriever
    retriever = get_retriever(vector_store=vector_store, k=4)

    # 3. Format docs helper
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    retriever_chain = RunnableParallel(
        context=retriever | format_docs,
        question=RunnablePassthrough()
    )

    model = get_Model()

    parser = StrOutputParser()

    rag_chain = retriever_chain | prompt | model | parser

    try:
        answer = rag_chain.invoke(que)
        chunk_count = vector_store._collection.count()
        return ChatResponse(
            status="success",
            video_id=video_id,
            question=que,
            answer=answer,
            chunks_indexed=chunk_count
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM generation failed: {str(e)}"
        )

if __name__ == '__main__':
    uvicorn.run(app, host='[IP_ADDRESS]', port=8000)