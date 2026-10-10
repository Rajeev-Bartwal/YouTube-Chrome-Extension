// Content script running on YouTube pages
(() => {
  console.log("YouTube AI Chatbot content script loaded.");

  function getYouTubeVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  function getVideoTitle() {
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1');
    return titleElement ? titleElement.textContent.trim() : document.title.replace(' - YouTube', '');
  }

  // Respond to popup requests for video information
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getVideoInfo') {
        const videoId = getYouTubeVideoId();
        const videoTitle = getVideoTitle();
        sendResponse({
          videoId: videoId,
          title: videoTitle,
          url: window.location.href
        });
      }
      return true;
    });
  }

  // Detect YouTube SPA page navigation
  window.addEventListener('yt-navigate-finish', () => {
    const videoId = getYouTubeVideoId();
    if (videoId && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'videoChanged',
        videoId: videoId,
        title: getVideoTitle()
      }).catch(() => {
        // Suppress errors when popup is closed
      });
    }
  });
})();
