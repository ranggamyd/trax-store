"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Berapa lama nungguin extension bales PING sebelum dianggap belum keinstall
const PING_TIMEOUT_MS = 2500;
// Jeda antar percobaan; nilai terakhir dipake terus, jadi retry-nya gak pernah nyerah
const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000, 30000];
// Kalau extension belum keinstall, tetep diintip berkala biar auto-pulih pas dia dipasang
const EXTENSION_RESCAN_MS = 15000;

export const TOKEN_STATUS = {
    OK: "ok",
    RECOVERING: "recovering",
    FAILED: "failed",
};

export const TOKEN_FAILURE = {
    NO_EXTENSION: "NO_EXTENSION",
    NOT_LOGGED_IN: "NOT_LOGGED_IN",
};

// Dipake bareng semua instance hook biar token yang sama gak di-POST berkali-kali
let lastSyncedToken = null;
let syncPromise = null;

function syncTokenToServer(token) {
    if (!token) return Promise.resolve();
    if (token === lastSyncedToken) return syncPromise || Promise.resolve();

    lastSyncedToken = token;
    syncPromise = fetch("/api/sync-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    }).catch(() => {
        // Gagal sync? Biarin token-nya dianggap belum kekirim biar dicoba lagi
        lastSyncedToken = null;
    });
    return syncPromise;
}

/**
 * Nangani TOKEN_EXPIRED_401 tanpa langsung nyalahin user.
 *
 * Selama extension kepasang dan akun Eldorado masih login, hook ini retry terus sampe token kejemput.
 * Error cuma dimunculin buat kondisi yang emang gak bisa ditolong retry:
 *   - extension TraxStore Auto-Sync belum keinstall / belum aktif di Chrome (NO_EXTENSION)
 *   - belum login di eldorado.gg, jadi cookie-nya emang gak ada (NOT_LOGGED_IN)
 *
 * @param {() => Promise<any>} onRetry - dipanggil tiap percobaan, biasanya buat refetch data halaman
 */
export function useTokenRecovery(onRetry) {
    const [tokenStatus, setTokenStatus] = useState(TOKEN_STATUS.OK);
    const [tokenFailure, setTokenFailure] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const onRetryRef = useRef(onRetry);
    onRetryRef.current = onRetry;

    const statusRef = useRef(TOKEN_STATUS.OK);
    const failureRef = useRef(null);
    const attemptRef = useRef(0);
    const refreshStartedRef = useRef(false);
    const pingTimerRef = useRef(null);
    const retryTimerRef = useRef(null);
    const rescanTimerRef = useRef(null);

    const clearTimers = useCallback(() => {
        clearTimeout(pingTimerRef.current);
        clearTimeout(retryTimerRef.current);
        clearInterval(rescanTimerRef.current);
        pingTimerRef.current = null;
        retryTimerRef.current = null;
        rescanTimerRef.current = null;
    }, []);

    const setStatus = useCallback((status, failure = null) => {
        statusRef.current = status;
        failureRef.current = failure;
        setTokenStatus(status);
        setTokenFailure(failure);
    }, []);

    const giveUp = useCallback(
        (failure) => {
            clearTimers();
            setStatus(TOKEN_STATUS.FAILED, failure);

            // Extension-nya belum ada: intip terus, begitu kepasang recovery jalan lagi sendiri
            if (failure === TOKEN_FAILURE.NO_EXTENSION) {
                rescanTimerRef.current = setInterval(() => {
                    window.postMessage({ type: "TRAX_PING" }, "*");
                }, EXTENSION_RESCAN_MS);
            }
        },
        [clearTimers, setStatus]
    );

    const scheduleRetry = useCallback(function schedule() {
        const delay = RETRY_DELAYS_MS[Math.min(attemptRef.current, RETRY_DELAYS_MS.length - 1)];
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(async () => {
            if (statusRef.current !== TOKEN_STATUS.RECOVERING) return;

            attemptRef.current += 1;
            setRetryCount(attemptRef.current);

            // Sundul extension tiap percobaan; kalau tab jemputannya udah nutup dia bakal nyoba lagi
            window.postMessage({ type: "TRAX_FORCE_REFRESH" }, "*");
            try {
                await onRetryRef.current?.();
            } catch {
                // Hasilnya dilaporin halaman lewat reportTokenOk / reportTokenExpired
            }

            if (statusRef.current === TOKEN_STATUS.RECOVERING) schedule();
        }, delay);
    }, []);

    const startRefresh = useCallback(() => {
        if (refreshStartedRef.current) return;
        refreshStartedRef.current = true;

        clearTimeout(pingTimerRef.current);
        pingTimerRef.current = null;

        window.postMessage({ type: "TRAX_FORCE_REFRESH" }, "*");
        scheduleRetry();
    }, [scheduleRetry]);

    // Dipanggil halaman tiap dapet TOKEN_EXPIRED_401
    const reportTokenExpired = useCallback(() => {
        if (typeof window === "undefined") return;
        // Lagi diurus atau udah nyerah: jangan bikin loop baru
        if (statusRef.current !== TOKEN_STATUS.OK) return;

        clearTimers();
        attemptRef.current = 0;
        setRetryCount(0);
        refreshStartedRef.current = false;
        setStatus(TOKEN_STATUS.RECOVERING);

        // Cek extension-nya kepasang apa nggak, sambil langsung minta dijemputin.
        // FORCE_REFRESH-nya dikirim duluan biar extension versi lama (yang belum ngerti PING) tetep kebagian kerja.
        window.postMessage({ type: "TRAX_PING" }, "*");
        window.postMessage({ type: "TRAX_FORCE_REFRESH" }, "*");
        pingTimerRef.current = setTimeout(() => {
            if (statusRef.current === TOKEN_STATUS.RECOVERING && !refreshStartedRef.current) {
                giveUp(TOKEN_FAILURE.NO_EXTENSION);
            }
        }, PING_TIMEOUT_MS);
    }, [clearTimers, giveUp, setStatus]);

    // Dipanggil halaman tiap request-nya udah sukses lagi
    const reportTokenOk = useCallback(() => {
        if (statusRef.current === TOKEN_STATUS.OK) return;
        clearTimers();
        attemptRef.current = 0;
        setRetryCount(0);
        refreshStartedRef.current = false;
        setStatus(TOKEN_STATUS.OK);
    }, [clearTimers, setStatus]);

    useEffect(() => {
        const handleMessage = async (event) => {
            if (event.source !== window) return;
            if (!event.data || typeof event.data.type !== "string") return;

            switch (event.data.type) {
                // Extension nyaut: berarti dia kepasang, lanjut jemput token
                case "TRAX_PONG":
                case "TRAX_EXTENSION_READY": {
                    if (statusRef.current === TOKEN_STATUS.RECOVERING) {
                        startRefresh();
                    } else if (statusRef.current === TOKEN_STATUS.FAILED && failureRef.current === TOKEN_FAILURE.NO_EXTENSION) {
                        // Extension baru kepasang, ulang dari awal
                        setStatus(TOKEN_STATUS.OK);
                        reportTokenExpired();
                    }
                    break;
                }

                case "TRAX_TOKEN_REFRESHED": {
                    const wasBroken = statusRef.current !== TOKEN_STATUS.OK;
                    if (wasBroken) {
                        clearTimers();
                        refreshStartedRef.current = true;
                        setStatus(TOKEN_STATUS.RECOVERING);
                    }

                    await syncTokenToServer(event.data.token);
                    try {
                        await onRetryRef.current?.();
                    } catch {
                        // Sama, hasilnya dilaporin halaman
                    }

                    if (wasBroken && statusRef.current === TOKEN_STATUS.RECOVERING) scheduleRetry();
                    break;
                }

                case "TRAX_TOKEN_REFRESH_FAILED": {
                    // Cuma "belum login" yang gak bisa ditolong retry; TIMEOUT mah dicoba lagi aja
                    if (event.data.reason === TOKEN_FAILURE.NOT_LOGGED_IN) {
                        giveUp(TOKEN_FAILURE.NOT_LOGGED_IN);
                    }
                    break;
                }

                default:
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [clearTimers, giveUp, reportTokenExpired, scheduleRetry, setStatus, startRefresh]);

    useEffect(() => clearTimers, [clearTimers]);

    return {
        tokenStatus,
        tokenFailure,
        retryCount,
        isRecoveringToken: tokenStatus === TOKEN_STATUS.RECOVERING,
        hasTokenProblem: tokenStatus !== TOKEN_STATUS.OK,
        reportTokenExpired,
        reportTokenOk,
    };
}
