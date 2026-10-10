// Background Service Worker (Manifest V3)
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube AI Video Chatbot extension installed successfully.");
  // Initialize default local storage settings
  chrome.storage.local.set({
    serverUrl: "http://127.0.0.1:8000",
    lastVideoId: "w2tidSx0Zhk"
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'videoChanged') {
    chrome.storage.local.set({
      lastVideoId: message.videoId,
      lastVideoTitle: message.title
    });
  }
  return true;
});
