// content.js - Injected into the TraxStore tab

function tellFrontend(message) {
    window.postMessage(message, "*");
}

function tellBackground(message) {
    try {
        chrome.runtime.sendMessage(message);
    } catch (err) {
        // Biasanya kejadian kalau extension baru di-reload tapi tab-nya belum
        console.log("[TraxStore Extension] Gagal ngomong ke background:", err);
    }
}

// Kasih tau frontend kalau extension-nya udah nempel, biar dia gak nampilin error "belum keinstall"
tellFrontend({ type: "TRAX_EXTENSION_READY" });

window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;
    if (!event.data || typeof event.data.type !== "string") return;

    // Frontend nanya "lu kepasang gak?"
    if (event.data.type === "TRAX_PING") {
        tellFrontend({ type: "TRAX_PONG" });
        return;
    }

    if (event.data.type === "TRAX_FORCE_REFRESH") {
        console.log("[TraxStore Extension] Received force refresh command from frontend!");
        tellBackground({ action: "FORCE_REFRESH" });
    }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "TOKEN_REFRESHED_SUCCESSFULLY") {
        console.log("[TraxStore Extension] Token successfully refreshed! Relaying to frontend...");
        tellFrontend({ type: "TRAX_TOKEN_REFRESHED", token: request.token });
    }

    if (request.action === "TOKEN_REFRESH_FAILED") {
        console.log("[TraxStore Extension] Gagal jemput token:", request.reason);
        tellFrontend({ type: "TRAX_TOKEN_REFRESH_FAILED", reason: request.reason });
    }
});
