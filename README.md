# 🎥 YouTube Video Chatbot (My First RAG Application)

A Retrieval-Augmented Generation (RAG) system that allows you to chat with any YouTube video and ask questions based strictly on its transcript. 

---

## 💡 What is this project?
Instead of watching long 1-2 hour YouTube videos or podcasts, this chatbot lets you extract the core insights instantly. It reads the video transcript, stores it in a vector database, and generates accurate, hallucination-free answers to your questions.

---

## 🛠️ How it works (Kya hua & Kya kiya)

1. **Transcript Extraction:** YouTube Video ID ke through transcript text fetch hota hai using `youtube-transcript-api` (supporting both English and Hindi).
2. **Chunking:** Poore transcript ko 1000 characters ke smaller context chunks mein split kiya using LangChain ke `RecursiveCharacterTextSplitter`.
3. **Embeddings & Vector Store:** Google GenAI (`models/gemini-embedding-001`) se chunks ko vectorize kiya aur locally `ChromaDB` mein persist kiya.
4. **MMR Retrieval:** User ke question ke आधार par `Maximal Marginal Relevance (MMR)` search use karke top relevant context chunks retrieve hote hain.
5. **Answer Generation:** Groq LLM (`openai/gpt-oss-120b`) aur custom prompt template ke through accurate, grounded, aur Hinglish/English answers milte hain.

---

## 🏗️ Tech Stack

- **Framework:** LangChain & LCEL (LangChain Expression Language)
- **LLM:** Groq (`openai/gpt-oss-120b`)
- **Embeddings:** Google Generative AI (`gemini-embedding-001`)
- **Vector Database:** ChromaDB
- **Transcript Engine:** `youtube-transcript-api`

---

## 🚀 Quick Setup & Run

### 1. Environment & Dependencies
```bash
# Virtual environment create & activate
uv venv Yt-ChatBot
.\Yt-ChatBot\Scripts\activate

# Dependencies install
uv pip install -r requierments.txt
```

### 2. Environment Variables (.env)
Create a `.env` file in the root folder:
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
```

### 3. Run the Chatbot
```bash
python app.py
```
