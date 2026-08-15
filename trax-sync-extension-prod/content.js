// content.js - Injected into localhost:3000

window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data && event.data.type === "TRAX_FORCE_REFRESH") {
        console.log("[TraxStore Extension] Received force refresh command from frontend!");
        chrome.runtime.sendMessage({ action: "FORCE_REFRESH" });
    }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TOKEN_REFRESHED_SUCCESSFULLY") {
        console.log("[TraxStore Extension] Token successfully refreshed! Relaying to frontend...");
        window.postMessage({ type: "TRAX_TOKEN_REFRESHED" }, "*");
    }
});
