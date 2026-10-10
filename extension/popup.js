// YouTube Video AI Chatbot - Popup Logic
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const statusBadge = document.getElementById("statusBadge");
  const statusText = document.getElementById("statusText");
  const videoTitleText = document.getElementById("videoTitleText");
  const videoIdText = document.getElementById("videoIdText");
  const changeVideoBtn = document.getElementById("changeVideoBtn");
  const videoInputDrawer = document.getElementById("videoInputDrawer");
  const manualVideoInput = document.getElementById("manualVideoInput");
  const saveVideoBtn = document.getElementById("saveVideoBtn");
  const demoVideoBtn = document.getElementById("demoVideoBtn");
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const questionInput = document.getElementById("questionInput");
  const sendBtn = document.getElementById("sendBtn");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const chipButtons = document.querySelectorAll(".chip-btn");
  
  // Settings Modal Elements
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const serverUrlInput = document.getElementById("serverUrlInput");
  const testConnectionBtn = document.getElementById("testConnectionBtn");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const serverTestResult = document.getElementById("serverTestResult");

  // State
  let currentVideoId = "w2tidSx0Zhk"; // Default demo video
  let serverUrl = "http://127.0.0.1:8000";
  let isRequestPending = false;

  // Safe storage helper (supports both chrome.storage and localStorage)
  const Storage = {
    get: async (key, defaultValue) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            resolve(result[key] !== undefined ? result[key] : defaultValue);
          });
        });
      } else {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultValue;
      }
    },
    set: async (key, value) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, resolve);
        });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  };

  // Helper to extract YouTube ID from URL or text
  function parseVideoId(text) {
    if (!text) return null;
    text = text.trim();
    const regex = /(?:v=|\/v\/|embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = text.match(regex);
    if (match && match[1]) return match[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
    return null;
  }

  // Format markdown simple text (bold, lists, linebreaks)
  function formatMarkdown(text) {
    if (!text) return "";
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold **text**
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Bullet lists
    const lines = safe.split("\n");
    let inList = false;
    let result = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        if (!inList) {
          result.push("<ul>");
          inList = true;
        }
        result.push(`<li>${trimmed.substring(2)}</li>`);
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (!inList) {
          result.push("<ol>");
          inList = true;
        }
        result.push(`<li>${trimmed.replace(/^\d+\.\s/, "")}</li>`);
      } else {
        if (inList) {
          result.push("</ul>");
          inList = false;
        }
        if (trimmed.length > 0) {
          result.push(`<p>${trimmed}</p>`);
        }
      }
    }
    if (inList) result.push("</ul>");
    return result.join("");
  }

  // Initialize
  async function init() {
    // 1. Load settings
    const savedServer = await Storage.get("serverUrl", "http://127.0.0.1:8000");
    serverUrl = savedServer;
    serverUrlInput.value = serverUrl;

    // 2. Detect active tab video
    await detectCurrentTabVideo();

    // 3. Load chat history for video
    await loadChatHistory();

    // 4. Check backend server health
    checkBackendHealth();
  }

  // Detect active YouTube tab
  async function detectCurrentTabVideo() {
    let detected = false;
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0] && tabs[0].url) {
          const url = tabs[0].url;
          const id = parseVideoId(url);
          if (id) {
            currentVideoId = id;
            videoTitleText.textContent = tabs[0].title ? tabs[0].title.replace(" - YouTube", "") : "YouTube Video";
            videoIdText.textContent = id;
            detected = true;
          }
        }
      } catch (err) {
        console.warn("Could not query active tab:", err);
      }
    }

    if (!detected) {
      const savedVideoId = await Storage.get("lastVideoId", "w2tidSx0Zhk");
      currentVideoId = savedVideoId;
      videoIdText.textContent = currentVideoId;
      videoTitleText.textContent = currentVideoId === "w2tidSx0Zhk" 
        ? "Paramedical Admission Guide (Demo Video)" 
        : `Custom Video (${currentVideoId})`;
    }
  }

  // Check backend server health
  async function checkBackendHealth() {
    statusBadge.className = "status-badge status-checking";
    statusText.textContent = "Checking...";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${serverUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        statusBadge.className = "status-badge status-online";
        statusText.textContent = "Connected";
        statusBadge.title = "Backend is online and ready!";
      } else {
        throw new Error("Invalid response");
      }
    } catch (e) {
      statusBadge.className = "status-badge status-offline";
      statusText.textContent = "Offline";
      statusBadge.title = "Backend offline. Make sure 'python server.py' is running.";
    }
  }

  // Add message to chat UI
  function appendMessage(role, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}-message`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (role === "ai") {
      bubble.innerHTML = formatMarkdown(text);
      const actions = document.createElement("div");
      actions.className = "msg-actions";
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.innerHTML = `📋 Copy`;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.textContent = "✓ Copied";
        setTimeout(() => (copyBtn.textContent = "📋 Copy"), 1500);
      };
      actions.appendChild(copyBtn);
      msgDiv.appendChild(bubble);
      msgDiv.appendChild(actions);
    } else {
      bubble.textContent = text;
      msgDiv.appendChild(bubble);
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Load chat history from storage
  async function loadChatHistory() {
    const history = await Storage.get(`chat_${currentVideoId}`, []);
    if (history && history.length > 0) {
      chatMessages.innerHTML = "";
      history.forEach((msg) => appendMessage(msg.role, msg.text));
    }
  }

  // Save message to storage
  async function saveMessage(role, text) {
    const history = await Storage.get(`chat_${currentVideoId}`, []);
    history.push({ role, text, timestamp: Date.now() });
    await Storage.set(`chat_${currentVideoId}`, history);
  }

  // Send message to local RAG backend
  async function sendMessage(question) {
    if (!question || isRequestPending) return;

    question = question.trim();
    if (!question) return;

    isRequestPending = true;
    sendBtn.disabled = true;
    appendMessage("user", question);
    await saveMessage("user", question);

    questionInput.value = "";
    loadingIndicator.classList.remove("hidden");
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch(`${serverUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: currentVideoId,
          video_id: currentVideoId,
          question: question
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const answer = data.answer || "No response received.";

      appendMessage("ai", answer);
      await saveMessage("ai", answer);

      // Verify connection badge is green
      statusBadge.className = "status-badge status-online";
      statusText.textContent = "Connected";
    } catch (err) {
      console.error("API Error:", err);
      const errorMsg = `⚠️ Error: ${err.message}. Please verify the local server is running ('python server.py') and that video '${currentVideoId}' has available transcripts.`;
      appendMessage("system", errorMsg);
      statusBadge.className = "status-badge status-offline";
      statusText.textContent = "Offline";
    } finally {
      loadingIndicator.classList.add("hidden");
      isRequestPending = false;
      sendBtn.disabled = false;
      questionInput.focus();
    }
  }

  // Event Listeners
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(questionInput.value);
  });

  questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(questionInput.value);
    }
  });

  // Toggle Video Drawer
  changeVideoBtn.addEventListener("click", () => {
    videoInputDrawer.classList.toggle("hidden");
    if (!videoInputDrawer.classList.contains("hidden")) {
      manualVideoInput.focus();
    }
  });

  // Set Manual Video
  saveVideoBtn.addEventListener("click", async () => {
    const raw = manualVideoInput.value.trim();
    const id = parseVideoId(raw);
    if (id) {
      currentVideoId = id;
      videoIdText.textContent = id;
      videoTitleText.textContent = `Video (${id})`;
      await Storage.set("lastVideoId", id);
      videoInputDrawer.classList.add("hidden");
      manualVideoInput.value = "";
      await loadChatHistory();
    } else {
      alert("Please enter a valid YouTube Video URL or 11-character Video ID.");
    }
  });

  // Demo Video button
  demoVideoBtn.addEventListener("click", async () => {
    currentVideoId = "w2tidSx0Zhk";
    videoIdText.textContent = currentVideoId;
    videoTitleText.textContent = "Paramedical Admission Guide (Demo Video)";
    await Storage.set("lastVideoId", currentVideoId);
    videoInputDrawer.classList.add("hidden");
    manualVideoInput.value = "";
    await loadChatHistory();
  });

  // Quick chips
  chipButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) sendMessage(prompt);
    });
  });

  // Click status badge to re-check
  statusBadge.addEventListener("click", checkBackendHealth);

  // Settings Modal
  settingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
    serverTestResult.classList.add("hidden");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });

  // Save server url changes
  serverUrlInput.addEventListener("change", async () => {
    serverUrl = serverUrlInput.value.trim().replace(/\/+$/, "");
    await Storage.set("serverUrl", serverUrl);
    checkBackendHealth();
  });

  // Test connection button in settings
  testConnectionBtn.addEventListener("click", async () => {
    testConnectionBtn.textContent = "Testing...";
    serverTestResult.classList.remove("hidden");
    try {
      const targetUrl = serverUrlInput.value.trim().replace(/\/+$/, "");
      const res = await fetch(`${targetUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        serverTestResult.className = "test-result-box test-success";
        serverTestResult.innerHTML = `✅ <strong>Connected!</strong> ${data.service} is running smoothly.`;
        serverUrl = targetUrl;
        await Storage.set("serverUrl", serverUrl);
        statusBadge.className = "status-badge status-online";
        statusText.textContent = "Connected";
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      serverTestResult.className = "test-result-box test-error";
      serverTestResult.innerHTML = `❌ <strong>Failed:</strong> Could not connect to ${serverUrlInput.value}. Check if <code>python server.py</code> is running.`;
    } finally {
      testConnectionBtn.textContent = "🔄 Test Connection";
    }
  });

  // Clear chat button
  clearChatBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear the chat history for this video?")) {
      await Storage.set(`chat_${currentVideoId}`, []);
      chatMessages.innerHTML = `
        <div class="message system-message">
          <div class="message-bubble">
            <p>🧹 Chat cleared. Ask any new question about this video!</p>
          </div>
        </div>
      `;
      settingsModal.classList.add("hidden");
    }
  });

  init();
});
