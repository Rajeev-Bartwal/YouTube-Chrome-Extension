// YouTube Video AI Chatbot - Popup Logic
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const statusBadge = document.getElementById("statusBadge");
  const statusText = document.getElementById("statusText");
  const videoTitleText = document.getElementById("videoTitleText");
  const videoIdText = document.getElementById("videoIdText");
  const chatMessages = document.getElementById("chatMessages");
  const greetingBox = document.getElementById("greetingBox");
  const chatQuickChips = document.getElementById("chatQuickChips");
  const chatForm = document.getElementById("chatForm");
  const questionInput = document.getElementById("questionInput");
  const sendBtn = document.getElementById("sendBtn");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const contentArea = document.querySelector(".content-scroll-area");
  
  // Settings Modal Elements
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const serverUrlInput = document.getElementById("serverUrlInput");
  const testConnectionBtn = document.getElementById("testConnectionBtn");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const serverTestResult = document.getElementById("serverTestResult");
  const manualVideoInput = document.getElementById("manualVideoInput");
  const saveVideoBtn = document.getElementById("saveVideoBtn");
  const demoVideoBtn = document.getElementById("demoVideoBtn");

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

  // Set visual status safely
  function setStatus(type, label) {
    if (statusBadge) {
      statusBadge.className = `status-badge status-${type}`;
    }
    if (statusText) {
      statusText.textContent = label;
    }
  }

  // Initialize
  async function init() {
    try {
      // 1. Load settings
      const savedServer = await Storage.get("serverUrl", "http://127.0.0.1:8000");
      serverUrl = savedServer;
      if (serverUrlInput) serverUrlInput.value = serverUrl;

      // 2. Detect active tab video
      await detectCurrentTabVideo();

      // 3. Load chat history for video
      await loadChatHistory();

      // 4. Check backend server health
      checkBackendHealth();
    } catch (e) {
      console.error("Initialization error:", e);
    }
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
            const title = tabs[0].title ? tabs[0].title.replace(" - YouTube", "") : "YouTube Video";
            if (videoTitleText) videoTitleText.textContent = title;
            if (videoIdText) videoIdText.textContent = id;
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
      if (videoIdText) videoIdText.textContent = currentVideoId;
      if (videoTitleText) {
        videoTitleText.textContent = currentVideoId === "w2tidSx0Zhk" 
          ? "Paramedical Admission Guide (Demo)" 
          : `Video: ${currentVideoId}`;
      }
    }
  }

  // Check backend server health
  async function checkBackendHealth() {
    setStatus("checking", "Checking");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${serverUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus("online", "Connected");
      } else {
        throw new Error("Invalid response");
      }
    } catch (e) {
      setStatus("offline", "Offline");
    }
  }

  // Switch UI view between Greeting and Chat
  function setChatMode(inChat) {
    if (inChat) {
      if (greetingBox) greetingBox.classList.add("hidden");
      if (chatMessages) chatMessages.classList.remove("hidden");
      if (chatQuickChips) chatQuickChips.classList.remove("hidden");
    } else {
      if (greetingBox) greetingBox.classList.remove("hidden");
      if (chatMessages) chatMessages.classList.add("hidden");
      if (chatQuickChips) chatQuickChips.classList.add("hidden");
    }
  }

  // Add message to chat UI
  function appendMessage(role, text) {
    if (!chatMessages) return;

    setChatMode(true);

    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}-message`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (role === "ai") {
      bubble.innerHTML = formatMarkdown(text);
      msgDiv.appendChild(bubble);
    } else {
      bubble.textContent = text;
      msgDiv.appendChild(bubble);
    }

    chatMessages.appendChild(msgDiv);
    if (contentArea) {
      contentArea.scrollTop = contentArea.scrollHeight;
    }
  }

  // Load chat history from storage
  async function loadChatHistory() {
    if (!chatMessages) return;
    const history = await Storage.get(`chat_${currentVideoId}`, []);
    if (history && history.length > 0) {
      chatMessages.innerHTML = "";
      history.forEach((msg) => appendMessage(msg.role, msg.text));
      setChatMode(true);
    } else {
      chatMessages.innerHTML = "";
      setChatMode(false);
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
    if (sendBtn) sendBtn.disabled = true;
    appendMessage("user", question);
    await saveMessage("user", question);

    if (questionInput) questionInput.value = "";
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    if (contentArea) contentArea.scrollTop = contentArea.scrollHeight;

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
      setStatus("online", "Connected");
    } catch (err) {
      console.error("API Error:", err);
      const errorMsg = `⚠️ Error: ${err.message}. Make sure 'python server.py' is running and transcripts are available for video '${currentVideoId}'.`;
      appendMessage("system", errorMsg);
      setStatus("offline", "Offline");
    } finally {
      if (loadingIndicator) loadingIndicator.classList.add("hidden");
      isRequestPending = false;
      if (sendBtn) sendBtn.disabled = false;
      if (questionInput) questionInput.focus();
    }
  }

  // Form submit
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (questionInput) sendMessage(questionInput.value);
    });
  }

  // Enter key press in textarea
  if (questionInput) {
    questionInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(questionInput.value);
      }
    });
  }

  // GLOBAL EVENT DELEGATION FOR ALL CHIP BUTTONS
  // Guarantees clicking "Summarize", "Explain", etc. works every time!
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip-btn, .chip-btn-mini");
    if (chip) {
      e.preventDefault();
      const prompt = chip.getAttribute("data-prompt") || chip.textContent.trim();
      if (prompt) {
        sendMessage(prompt);
      }
    }
  });

  // Status badge click to re-check health
  if (statusBadge) {
    statusBadge.addEventListener("click", checkBackendHealth);
  }

  // Settings Modal open/close
  function openSettings() {
    if (settingsModal) {
      settingsModal.classList.remove("hidden");
      if (serverTestResult) serverTestResult.classList.add("hidden");
      if (serverUrlInput) serverUrlInput.value = serverUrl;
    }
  }

  function closeSettings() {
    if (settingsModal) {
      settingsModal.classList.add("hidden");
    }
  }

  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSettings();
    });
  }

  // Backup listener via event delegation
  document.addEventListener("click", (e) => {
    if (e.target.closest("#settingsBtn")) {
      e.preventDefault();
      openSettings();
    }
  });

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeSettings();
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        closeSettings();
      }
    });
  }

  // Save server url changes
  if (serverUrlInput) {
    serverUrlInput.addEventListener("change", async () => {
      serverUrl = serverUrlInput.value.trim().replace(/\/+$/, "");
      await Storage.set("serverUrl", serverUrl);
      checkBackendHealth();
    });
  }

  // Test connection button
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener("click", async () => {
      testConnectionBtn.textContent = "Testing...";
      if (serverTestResult) serverTestResult.classList.remove("hidden");
      try {
        const targetUrl = serverUrlInput ? serverUrlInput.value.trim().replace(/\/+$/, "") : serverUrl;
        const res = await fetch(`${targetUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          if (serverTestResult) {
            serverTestResult.className = "test-result-box test-success";
            serverTestResult.innerHTML = `✅ <strong>Connected!</strong> ${data.service || "Backend"} is online.`;
          }
          serverUrl = targetUrl;
          await Storage.set("serverUrl", serverUrl);
          setStatus("online", "Connected");
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        if (serverTestResult) {
          serverTestResult.className = "test-result-box test-error";
          serverTestResult.innerHTML = `❌ <strong>Failed:</strong> Backend offline. Run <code>python server.py</code>`;
        }
      } finally {
        testConnectionBtn.textContent = "Test Backend";
      }
    });
  }

  // Set Manual Video
  if (saveVideoBtn) {
    saveVideoBtn.addEventListener("click", async () => {
      if (!manualVideoInput) return;
      const raw = manualVideoInput.value.trim();
      const id = parseVideoId(raw);
      if (id) {
        currentVideoId = id;
        if (videoIdText) videoIdText.textContent = id;
        if (videoTitleText) videoTitleText.textContent = `Video: ${id}`;
        await Storage.set("lastVideoId", id);
        manualVideoInput.value = "";
        if (settingsModal) settingsModal.classList.add("hidden");
        await loadChatHistory();
      } else {
        alert("Please enter a valid YouTube Video URL or 11-character Video ID.");
      }
    });
  }

  // Demo Video button
  if (demoVideoBtn) {
    demoVideoBtn.addEventListener("click", async () => {
      currentVideoId = "w2tidSx0Zhk";
      if (videoIdText) videoIdText.textContent = currentVideoId;
      if (videoTitleText) videoTitleText.textContent = "Paramedical Admission Guide (Demo)";
      await Storage.set("lastVideoId", currentVideoId);
      if (settingsModal) settingsModal.classList.add("hidden");
      await loadChatHistory();
    });
  }

  // Clear chat button
  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", async () => {
      if (confirm("Clear chat history for this video?")) {
        await Storage.set(`chat_${currentVideoId}`, []);
        if (chatMessages) {
          chatMessages.innerHTML = "";
        }
        setChatMode(false);
        if (settingsModal) settingsModal.classList.add("hidden");
      }
    });
  }

  // Run initialization
  init();
});
