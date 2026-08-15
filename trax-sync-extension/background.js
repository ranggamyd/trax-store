// ====== CONFIGURATION ======
const IS_PRODUCTION = true; // Ubah ke false kalau lagi ngoding lokal (localhost)
const PROD_DOMAIN = "traxstore.vercel.app"; // Ganti sama domain asli Vercel lu nanti
const DEV_DOMAIN = "localhost:3000";

const TARGET_DOMAIN = IS_PRODUCTION ? PROD_DOMAIN : DEV_DOMAIN;
const SYNC_ENDPOINT = IS_PRODUCTION 
    ? `https://${TARGET_DOMAIN}/api/sync-token`
    : `http://${TARGET_DOMAIN}/api/sync-token`;
const TRAX_TAB_MATCH = IS_PRODUCTION
    ? `https://${TARGET_DOMAIN}/*`
    : `http://${TARGET_DOMAIN}/*`;
// =========================

const TARGET_COOKIE_NAME = "__Host-EldoradoIdToken";

let refreshTabId = null;

// Sync the token when the extension is first loaded or browser opens
chrome.cookies.get({ url: "https://www.eldorado.gg", name: TARGET_COOKIE_NAME }, (cookie) => {
    if (cookie) {
        syncToken(cookie.value);
    } else {
        console.log("No Eldorado token found on startup.");
    }
});

// Listen for any changes to the Eldorado cookies (e.g. login, token refresh)
chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.cookie.domain.includes("eldorado.gg") && changeInfo.cookie.name === TARGET_COOKIE_NAME) {
        if (!changeInfo.removed) {
            console.log("Eldorado token updated! Syncing to TraxStore...");
            syncToken(changeInfo.cookie.value);
        }
    }
});

function syncToken(token) {
    fetch(SYNC_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                console.log("🔥 Successfully synced token to TraxStore!");

                // If we had a background tab open for refresh, close it now that we succeeded!
                if (refreshTabId !== null) {
                    chrome.tabs.remove(refreshTabId, () => {
                        if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
                    });
                    refreshTabId = null;
                    console.log("Background tab closed because token was received!");
                }

                // Notify TraxStore tabs that token is ready
                chrome.tabs.query({ url: TRAX_TAB_MATCH }, (tabs) => {
                    tabs.forEach((tab) => {
                        chrome.tabs.sendMessage(tab.id, { action: "TOKEN_REFRESHED_SUCCESSFULLY" });
                    });
                });
            } else {
                console.error("Failed to sync token:", data.error);
            }
        })
        .catch((err) => console.error("Error connecting to TraxStore backend:", err));
}

// Listen for messages from Trax Store (via content script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FORCE_REFRESH") {
        if (refreshTabId !== null) {
            console.log("A refresh tab is already open, ignoring duplicate request.");
            return;
        }

        console.log("Forcing Eldorado token refresh via background tab...");
        chrome.tabs.create({ url: "https://www.eldorado.gg/", active: false }, (tab) => {
            refreshTabId = tab.id;

            // Wait for tab to finish loading, then just grab whatever cookie is there
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === refreshTabId && info.status === "complete") {
                    chrome.tabs.onUpdated.removeListener(listener);
                    // Wait 2 seconds for Eldorado's React app to initialize auth
                    setTimeout(() => {
                        chrome.cookies.get({ url: "https://www.eldorado.gg", name: TARGET_COOKIE_NAME }, (cookie) => {
                            if (cookie) {
                                console.log("Background tab loaded! Grabbing cookie directly...");
                                syncToken(cookie.value);
                            }
                        });
                    }, 2000);
                }
            });

            // Fail-safe: if Eldorado is down or token doesn't refresh, close it after 30s
            setTimeout(() => {
                if (refreshTabId === tab.id) {
                    chrome.tabs.remove(tab.id, () => {
                        if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
                    });
                    refreshTabId = null;
                    console.log("Fail-safe: Background tab closed after 30s timeout.");
                }
            }, 30000);
        });
    }
});
