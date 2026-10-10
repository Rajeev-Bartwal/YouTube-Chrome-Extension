import os
from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from youtube_transcript_api import YouTubeTranscriptApi

from modules.splitter import split_text_chunks
from modules.embedding import embeddings_doc
from modules.retriever import get_retriever
from modules.promptTemplate import prompt
from langchain_core.runnables import RunnableParallel , RunnablePassthrough 

load_dotenv()

video_id = 'w2tidSx0Zhk'  # ID of the YouTube video

# 1. Fetch Transcript
try:
    ytt_api = YouTubeTranscriptApi()
    transcript_obj = ytt_api.fetch(video_id, languages=['en', 'hi'])
    transcript = " ".join(chunk.text for chunk in transcript_obj)
except Exception as e:
    print("Error fetching transcript:", e)
    transcript = ""

# 2. Chunks & Vector Store
# (Already saved in ./chroma_db, uncomment if testing a new video):
# chunks = split_text_chunks(transcript)
# vector_store = embeddings_doc(chunks)

# 3. Retriever
retriever = get_retriever()

question = "Paramedical m addmission kaise hota h?? Hinglis m jwaa dena"
retrieved_docs = retriever.invoke(question)
context = "\n\n".join(doc.page_content for doc in retrieved_docs)

# 4. LLM & Chain
model = ChatGroq(
    api_key=os.getenv('GROQ_API_KEY'),
    model_name='openai/gpt-oss-120b',
    temperature=0.5
)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

retriever_chain = RunnableParallel(
    context=retriever | format_docs,
    question=RunnablePassthrough()
)

parser = StrOutputParser()
rag_chain = retriever_chain | prompt | model | parser

res = rag_chain.invoke(question)

print("Question:", question)
print("\nAnswer:\n", res)
