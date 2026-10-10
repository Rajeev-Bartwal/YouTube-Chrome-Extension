# 🚀 YouTube Video AI Chatbot - Chrome Extension

This folder contains the complete Manifest V3 Chrome Extension for local testing and chatting with YouTube videos via RAG.

---

## 📁 Directory Structure
```
extension/
├── manifest.json         # Chrome Extension Manifest V3 configuration
├── popup.html            # Main extension chat popup UI
├── popup.css             # Modern dark mode styling & micro-animations
├── popup.js              # Tab detection, chat state, and API caller
├── content.js            # Injected script to detect YouTube video changes
├── background.js         # Service worker for lifecycle & storage management
├── standalone-test.html  # In-browser test runner to test without installing
├── icons/                # Extension logos (16px, 48px, 128px)
└── README.md             # This guide
```

---

## 🛠️ Step 1: Start the Local Backend Server

The extension communicates with the local FastAPI RAG server to fetch transcripts, retrieve vector chunks via ChromaDB, and query Groq.

Open your terminal in the root directory:
```powershell
# Activate your virtual environment
.\Yt-ChatBot\Scripts\activate

# Start the server
python server.py
```
The server will start at: `http://127.0.0.1:8000`
You can verify health by visiting: `http://127.0.0.1:8000/health`

---

## 🔌 Step 2: Load the Extension into Google Chrome

1. Open **Google Chrome** (or Brave / Microsoft Edge).
2. Go to `chrome://extensions` in the address bar.
3. Turn **ON** the **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select this `extension` folder:
   ```
   d:\Rajeev\GenAi Projects\YouTube-Chrome-Extension\extension
   ```
6. You will now see **YouTube Video AI Chatbot** in your extensions list! Pin it to your Chrome toolbar for easy access.

---

## 🧪 Step 3: Local Testing

### Option A: Test Directly on YouTube
1. Open any YouTube video (for example, `https://www.youtube.com/watch?v=w2tidSx0Zhk`).
2. Click the extension icon in your Chrome toolbar.
3. The extension will automatically detect the video ID and title.
4. Click any quick prompt chip or type your question in English or Hinglish!

### Option B: Test Any Video ID or URL Manually
1. Click the extension icon anywhere (even on a blank tab).
2. Click the **Change** button next to the Video ID.
3. Paste any YouTube video URL or ID (or click **⚡ Use Demo Video**).
4. Start chatting!

### Option C: Browser Simulator
You can also open `extension/standalone-test.html` directly in your browser to test the full UI simulator.
