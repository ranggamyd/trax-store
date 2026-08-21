// ====== CONFIGURATION ======
const IS_PRODUCTION = false; // Ubah ke false kalau lagi ngoding lokal (localhost)
const PROD_DOMAIN = "trax-store.vercel.app"; // Ganti sama domain asli Vercel lu nanti
const DEV_DOMAIN = "localhost:3000";

const TARGET_DOMAIN = IS_PRODUCTION ? PROD_DOMAIN : DEV_DOMAIN;
const TRAX_TAB_MATCH = IS_PRODUCTION ? `https://${TARGET_DOMAIN}/*` : `http://${TARGET_DOMAIN}/*`;
// =========================

const TARGET_COOKIE_NAME = "__Host-EldoradoIdToken";
const REFRESH_TAB_TIMEOUT_MS = 30000;
// Kasih waktu React-nya Eldorado buat inisialisasi auth sebelum cookie-nya diintip
const COOKIE_GRAB_DELAY_MS = 2000;
// Diintip beberapa kali dulu; kalau langsung divonis "belum login" nanti salah tuduh pas Eldorado-nya lemot
const COOKIE_GRAB_ATTEMPTS = 5;

let refreshTabId = null;
// Dipasang duluan sebelum tabs.create kelar, biar dua halaman yang minta barengan gak bikin dua tab
let isRefreshing = false;

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

// Kirim pesan ke semua tab TraxStore yang lagi kebuka
function notifyTraxTabs(message) {
    chrome.tabs.query({ url: TRAX_TAB_MATCH }, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, message, () => {
                // Tab yang belum ada content script-nya bakal error, gak usah diributin
                if (chrome.runtime.lastError) return;
            });
        });
    });
}

// Tutup tab jemputan (kalau ada) sekalian buka kunci biar permintaan berikutnya boleh jalan
function endRefresh() {
    isRefreshing = false;
    if (refreshTabId === null) return;

    const tabId = refreshTabId;
    refreshTabId = null;
    chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
    });
}

function syncToken(token) {
    console.log("🔥 Grabbed token! Sending directly to TraxStore tab...");

    if (refreshTabId !== null) console.log("Background tab closed because token was received!");
    endRefresh();

    // Notify TraxStore tabs that token is ready, and pass the token!
    notifyTraxTabs({ action: "TOKEN_REFRESHED_SUCCESSFULLY", token: token });
}

// Intip cookie Eldorado berkali-kali; kalau sampe abis jatah tetep kosong berarti emang belum login
function grabCookie(attemptsLeft) {
    if (!isRefreshing) return; // tab jemputannya keburu ditutup / udah kelar

    chrome.cookies.get({ url: "https://www.eldorado.gg", name: TARGET_COOKIE_NAME }, (cookie) => {
        if (cookie) {
            console.log("Background tab loaded! Grabbing cookie directly...");
            syncToken(cookie.value);
            return;
        }

        if (attemptsLeft > 1) {
            setTimeout(() => grabCookie(attemptsLeft - 1), COOKIE_GRAB_DELAY_MS);
            return;
        }

        // Halaman Eldorado udah kebuka tapi cookie-nya tetep nihil = emang belum login
        endRefresh();
        reportFailure("NOT_LOGGED_IN");
    });
}

// Kabarin frontend kalau jemputannya gagal, biar dia tau ini bisa di-retry apa nggak
// NOT_LOGGED_IN = cookie Eldorado emang gak ada (harus login manual)
// TIMEOUT       = Eldorado lemot/down, aman buat dicoba lagi
function reportFailure(reason) {
    console.log("Gagal jemput token Eldorado:", reason);
    notifyTraxTabs({ action: "TOKEN_REFRESH_FAILED", reason: reason });
}

// Kalau tab jemputannya ditutup user, jangan sampe state-nya nyangkut
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === refreshTabId) {
        refreshTabId = null;
        isRefreshing = false;
    }
});

// Listen for messages from Trax Store (via content script)
chrome.runtime.onMessage.addListener((request) => {
    if (request.action !== "FORCE_REFRESH") return;

    if (isRefreshing) {
        console.log("A refresh tab is already open, ignoring duplicate request.");
        return;
    }
    isRefreshing = true;

    console.log("Forcing Eldorado token refresh via background tab...");
    chrome.tabs.create({ url: "https://www.eldorado.gg/", active: false }, (tab) => {
        if (chrome.runtime.lastError || !tab) {
            console.log("Gagal buka tab jemputan:", chrome.runtime.lastError);
            isRefreshing = false;
            reportFailure("TIMEOUT");
            return;
        }

        refreshTabId = tab.id;

        // Wait for tab to finish loading, then just grab whatever cookie is there
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === refreshTabId && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);

                setTimeout(() => grabCookie(COOKIE_GRAB_ATTEMPTS), COOKIE_GRAB_DELAY_MS);
            }
        });

        // Fail-safe: if Eldorado is down or token doesn't refresh, close it after 30s
        setTimeout(() => {
            if (refreshTabId === tab.id) {
                endRefresh();
                console.log("Fail-safe: Background tab closed after 30s timeout.");
                reportFailure("TIMEOUT");
            }
        }, REFRESH_TAB_TIMEOUT_MS);
    });
});
