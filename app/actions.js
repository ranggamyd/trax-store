"use server";

import { cookies } from "next/headers";

const ELDORADO_API_URL = process.env.ELDORADO_API_URL;

export async function setEldoradoToken(token, refreshToken = "") {
    const cookieStore = await cookies();
    if (token) cookieStore.set("eldorado_token", token, { path: "/" });
    if (refreshToken) cookieStore.set("eldorado_refresh_token", refreshToken, { path: "/" });
    return { success: true };
}

export async function getEldoradoToken() {
    const cookieStore = await cookies();
    return {
        idToken: cookieStore.get("eldorado_token")?.value || process.env.ELDORADO_ID_TOKEN || "",
        refreshToken: cookieStore.get("eldorado_refresh_token")?.value || process.env.ELDORADO_REFRESH_TOKEN || "",
    };
}

export async function refreshEldoradoToken() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("eldorado_refresh_token")?.value || process.env.ELDORADO_REFRESH_TOKEN;
    if (!refreshToken) return { success: false, error: "No refresh token available" };

    try {
        // AWS Cognito Endpoint for Eldorado.gg based on their JWT issuer
        const res = await fetch("https://cognito-idp.us-east-2.amazonaws.com/", {
            method: "POST",
            headers: {
                "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
                "Content-Type": "application/x-amz-json-1.1",
            },
            body: JSON.stringify({
                ClientId: process.env.ELDORADO_COGNITO_CLIENT_ID || "3a4hal6jgl8gf5hnnjo06k05s5",
                AuthFlow: "REFRESH_TOKEN_AUTH",
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            }),
        });

        const data = await res.json();
        if (data.AuthenticationResult?.IdToken) {
            const newToken = data.AuthenticationResult.IdToken;
            const cookieStore = await cookies();
            cookieStore.set("eldorado_token", newToken, { path: "/" });
            return { success: true, token: newToken };
        }
        return { success: false, error: "Failed to refresh token", data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getTalkJsToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get("eldorado_token")?.value || process.env.ELDORADO_ID_TOKEN;
    if (!token) return { success: false, error: "TOKEN_EXPIRED_401" };
    try {
        const res = await fetchEldorado("/conversations/me/authorize");
        if (res && res.token) {
            // Decode JWT to get user ID
            const parts = res.token.split(".");
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
                return { success: true, token: res.token, userId: payload.sub };
            }
        }
        return { success: false, error: "Failed to parse TalkJS token" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function fetchEldorado(endpoint, options = {}) {
    const cookieStore = await cookies();
    const tokenToUse = cookieStore.get("eldorado_token")?.value || process.env.ELDORADO_ID_TOKEN;
    if (!tokenToUse) {
        throw new Error("TOKEN_EXPIRED_401");
    }

    const response = await fetch(`${ELDORADO_API_URL}${endpoint}`, {
        cache: "no-store", // Disable Next.js aggressive fetch caching
        ...options,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Cookie: `__Host-EldoradoIdToken=${tokenToUse}`,
            ...options.headers,
        },
    });
    if (!response.ok) {
        if (response.status === 401) {
            const cookieStore = await cookies();
            const refreshToken = cookieStore.get("eldorado_refresh_token")?.value || process.env.ELDORADO_REFRESH_TOKEN;
            if (refreshToken) {
                console.log("Token expired during API call, attempting refresh...");
                const refreshed = await refreshEldoradoToken();
                if (refreshed.success) {
                    // Retry the original request
                    return fetchEldorado(endpoint, options);
                }
            }
            throw new Error("TOKEN_EXPIRED_401");
        }
        const errorText = await response.text();
        throw new Error(`Eldorado API Error: ${response.status} ${errorText}`);
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

function isRobloxDetail(detail) {
    return detail?.type === "RobloxUsername" || detail?.name === "RobloxUsername";
}

// Value delivery detail sifatnya immutable begitu buyer submit, jadi aman di-cache.
// Ini nahan spam request pas order list auto-refresh tiap beberapa detik.
const deliveryDetailCache = new Map();
const DELIVERY_DETAIL_CACHE_MAX = 500;

async function fetchDeliveryDetailValue(orderId, detailId) {
    const cacheKey = `${orderId}:${detailId}`;
    if (deliveryDetailCache.has(cacheKey)) return deliveryDetailCache.get(cacheKey);

    try {
        // Response-nya cuma { "value": "em4qi" }
        const res = await fetchEldorado(`/v1/orders/me/${orderId}/delivery-details/${detailId}`);
        const value = typeof res?.value === "string" && res.value.trim() ? res.value.trim() : null;

        if (value) {
            if (deliveryDetailCache.size >= DELIVERY_DETAIL_CACHE_MAX) {
                deliveryDetailCache.delete(deliveryDetailCache.keys().next().value);
            }
            deliveryDetailCache.set(cacheKey, value);
        }
        return value;
    } catch (error) {
        // Satu detail gagal jangan sampai bikin seluruh list order gagal
        console.error(`[fetchDeliveryDetailValue] ${orderId}/${detailId}:`, error.message);
        return null;
    }
}

/**
 * Roblox username bisa dateng dari dua bentuk payload:
 *  1. `deliveryDetails[]` -> value-nya udah inline, langsung pake.
 *  2. `deliveryDetails: null` + `deliveryDetailsSubmission.details[]` -> di situ cuma
 *     ada { id, type }, value-nya harus dihit satu-satu ke /delivery-details/{id}.
 * Balikin { details, inline } biar caller tau perlu backfill `deliveryDetails` atau ga.
 */
async function resolveRobloxDetails(order) {
    if (!order) return { details: [], inline: true };

    const inlineDetails = (Array.isArray(order.deliveryDetails) ? order.deliveryDetails : []).filter((d) => isRobloxDetail(d) && typeof d.value === "string" && d.value.trim());
    if (inlineDetails.length > 0) return { details: inlineDetails, inline: true };

    const submitted = order.deliveryDetailsSubmission?.details;
    if (!order.id || !Array.isArray(submitted)) return { details: [], inline: true };

    const pending = submitted.filter((d) => isRobloxDetail(d) && d.id);
    if (pending.length === 0) return { details: [], inline: true };

    const fetched = [];
    for (const detail of pending) {
        const value = await fetchDeliveryDetailValue(order.id, detail.id);
        if (value) fetched.push({ ...detail, value });
    }
    return { details: fetched, inline: false };
}

/** Jalanin worker paralel tapi dibatesin, biar 50 order ga nembak 50 request sekaligus. */
async function mapWithLimit(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await worker(items[index], index);
        }
    });

    await Promise.all(runners);
    return results;
}

/** Bentuk order mentah dari API jadi shape yang dipake UI. */
async function mapOrder(order) {
    const { details: robloxDetails, inline } = await resolveRobloxDetails(order);

    // Backfill `raw.deliveryDetails` kalau value-nya hasil hit terpisah, supaya UI yang
    // baca raw.deliveryDetails (app/orders/page.js) tetep jalan tanpa perlu diubah.
    if (robloxDetails.length > 0 && !inline) {
        order.deliveryDetails = [...(Array.isArray(order.deliveryDetails) ? order.deliveryDetails : []), ...robloxDetails];
    }

    const robloxUser = robloxDetails.map((d) => d.value).join(" ") || order.userRequestDetails?.robloxUsername || order.robloxUsername || null;

    return {
        id: order.id,
        buyer: order.buyerUsername,
        game: order.orderOfferDetails?.offerTitle || order.orderOfferDetails?.gameCategoryTitle || "Item",
        quantity: order.purchaseQuantity || 1,
        robloxUsername: robloxUser,
        status: order.state?.state,
        talkJsConversationId: order.talkJsConversationId,
        raw: order,
    };
}

export async function getEldoradoOrders(params = {}) {
    try {
        const { query = "", orderState = "", cursorValue = "", pageSize = 50 } = params;

        const searchParams = new URLSearchParams();
        searchParams.append("displayFilter", "DisplaySellingOrders");
        searchParams.append("pageSize", pageSize.toString());

        if (query) searchParams.append("query", query);
        if (orderState) searchParams.append("orderState", orderState);
        if (cursorValue) {
            searchParams.append("cursorValue", cursorValue);
            searchParams.append("pageDirection", "Next");
        }

        const data = await fetchEldorado(`/v1/orders/me/seller/orders?${searchParams.toString()}`);

        let parsedOrders = [];
        if (data && data.results && Array.isArray(data.results)) {
            parsedOrders = await mapWithLimit(data.results, 6, (order) => mapOrder(order));
        }

        return {
            success: true,
            data: parsedOrders,
            nextPageCursor: data?.nextPageCursor || null,
        };
    } catch (error) {
        console.error("[getEldoradoOrders] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getEldoradoMessages(orderId) {
    try {
        // Karena Eldorado menggunakan TalkJS pihak ketiga untuk sistem chat (terlihat dari talkJsConversationId),
        // kita belum bisa menarik chat secara langsung pakai REST API Eldorado tanpa token TalkJS mereka.
        // Jadi untuk MVP, kita kembalikan data mock dulu ketika sebuah order diklik.

        // Simulasi delay jaringan
        await new Promise((res) => setTimeout(res, 500));

        const mockMessages = [
            {
                id: 1,
                text: "Halo bang, pesanan saya (Order ID: " + orderId.substring(0, 8) + "...) udah siap?",
                sender: "buyer",
                time: "10:30",
            },
            { id: 2, text: "Sabar ya bro, ini lagi diproses pengirimannya", sender: "me", time: "10:35" },
        ];
        return { success: true, data: mockMessages };
    } catch (error) {
        console.error(`[getEldoradoMessages] Error for ${orderId}:`, error.message);
        return { success: false, error: error.message };
    }
}

export async function sendEldoradoMessage(formData) {
    const message = formData.get("message");
    const orderId = formData.get("orderId");

    if (!message || !orderId) {
        return { success: false, error: "Pesan atau Order ID tidak valid bro!" };
    }

    try {
        await fetchEldorado(`/v1/orders/${orderId}/messages`, {
            method: "POST",
            body: JSON.stringify({ content: message, text: message }),
        });
        return { success: true };
    } catch (error) {
        console.error("[sendEldoradoMessage] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function markOrderDelivered(orderId) {
    if (!orderId) {
        return { success: false, error: "Order ID ga ada!" };
    }

    try {
        // Sesuai dengan Swagger: PUT /api/v1/orders/me/{orderId}/deliver
        await fetchEldorado(`/v1/orders/me/${orderId}/deliver`, {
            method: "PUT",
        });
        return { success: true };
    } catch (error) {
        console.error("[markOrderDelivered] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function cancelOrder(orderId, reason, message = "") {
    if (!orderId) {
        return { success: false, error: "Order ID ga ada!" };
    }

    try {
        const body = {
            reason: reason || "Other",
            message: message,
        };

        await fetchEldorado(`/v1/orders/me/${orderId}/cancel`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        return { success: true };
    } catch (error) {
        console.error("[cancelOrder] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getEldoradoOrderDetails(orderId) {
    if (!orderId) {
        return { success: false, error: "Order ID ga ada!" };
    }

    try {
        const order = await fetchEldorado(`/v1/orders/me/${orderId}`);

        return {
            success: true,
            data: await mapOrder(order),
        };
    } catch (error) {
        console.error(`[getEldoradoOrderDetails] Error for ${orderId}:`, error.message);
        return { success: false, error: error.message };
    }
}

export async function getEldoradoOffers(params = {}) {
    try {
        const { query = "", offerState = "", category = "", deliveryTime = "", gameId = "", lowestPrice = "", highestPrice = "", pageIndex = 0, pageSize = 50, offerSortingCriterion = "", isAscending = "" } = params;

        const searchParams = new URLSearchParams();
        searchParams.append("pageSize", pageSize.toString());
        if (pageIndex > 0) searchParams.append("pageIndex", pageIndex.toString());

        if (query) searchParams.append("searchQuery", query);
        if (offerState) searchParams.append("offerState", offerState);
        if (category) searchParams.append("category", category);
        if (deliveryTime) searchParams.append("deliveryTime", deliveryTime);
        if (gameId) searchParams.append("gameId", gameId);
        if (lowestPrice) searchParams.append("lowestPrice", lowestPrice);
        if (highestPrice) searchParams.append("highestPrice", highestPrice);
        if (offerSortingCriterion) searchParams.append("offerSortingCriterion", offerSortingCriterion);
        if (isAscending !== "") searchParams.append("isAscending", isAscending);

        const data = await fetchEldorado(`/v1/item-management/me/offers/me/search?${searchParams.toString()}`);

        let parsedOffers = [];
        if (data && data.results && Array.isArray(data.results)) {
            parsedOffers = data.results.map((offer) => ({
                id: offer.id,
                userId: offer.userId,
                gameId: offer.gameId,
                offerTitle: offer.offerTitle || "Item",
                gameCategoryTitle: offer.gameCategoryTitle || "Game",
                gameSeoAlias: offer.gameSeoAlias,
                category: offer.category || "Category",
                quantity: offer.quantity || 0,
                minQuantity: offer.minQuantity || 0,
                maxPurchaseQuantity: offer.maxPurchaseQuantity || 0,
                volumeDiscounts: offer.volumeDiscounts || [],
                pricePerUnit: offer.pricePerUnit || { amount: 0, currency: "USD" },
                pricePerUnitWithDiscount: offer.pricePerUnitWithDiscount,
                pricePerUnitInUSD: offer.pricePerUnitInUSD,
                discountPercentage: offer.discountPercentage || 0,
                minPurchasePrice: offer.minPurchasePrice,
                exchangeRate: offer.exchangeRate,
                offerState: offer.offerState || "Unknown",
                guaranteedDeliveryTime: offer.guaranteedDeliveryTime || "-",
                expireDate: offer.expireDate,
                offerVersion: offer.offerVersion,
                description: offer.description || "",
                tradeEnvironmentValues: offer.tradeEnvironmentValues || [],
                offerAttributeIdValues: offer.offerAttributeIdValues || [],
                attributes: offer.attributes || [],
                mainOfferImage: offer.mainOfferImage,
                offerImages: offer.offerImages || [],
                orderCounts: offer.orderCounts || { last24Hours: 0, last30Days: 0, allTime: 0 },
                standardizedProductKey: offer.standardizedProductKey,
                isProduct: offer.isProduct,
                productImage: offer.productImage,
                raw: offer,
            }));
        }

        return {
            success: true,
            data: parsedOffers,
            pageIndex: data?.pageIndex || 0,
            totalPages: data?.totalPages || 0,
            recordCount: data?.recordCount || 0,
            pageSize: data?.pageSize || pageSize,
        };
    } catch (error) {
        console.error("[getEldoradoOffers] Error:", error.message);
        return { success: false, error: error.message };
    }
}

// --- Offer CRUD Actions ---

export async function createEldoradoOffer(body) {
    try {
        const data = await fetchEldorado("/v1/item-management/me/offers/item", {
            method: "POST",
            body: JSON.stringify(body),
        });
        return { success: true, data };
    } catch (error) {
        console.error("[createEldoradoOffer] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function updateEldoradoOfferDetails(offerId, body) {
    if (!offerId) return { success: false, error: "offerId is required" };
    try {
        const data = await fetchEldorado(`/v1/item-management/me/offers/item/${offerId}/details`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
        return { success: true, data };
    } catch (error) {
        console.error("[updateEldoradoOfferDetails] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function deleteEldoradoOffer(offerId) {
    if (!offerId) return { success: false, error: "offerId is required" };
    try {
        await fetchEldorado(`/v1/item-management/me/offers/${offerId}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        console.error("[deleteEldoradoOffer] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function pauseEldoradoOffer(offerId) {
    if (!offerId) return { success: false, error: "offerId is required" };
    try {
        await fetchEldorado(`/v1/item-management/me/offers/${offerId}/pause`, {
            method: "POST",
        });
        return { success: true };
    } catch (error) {
        console.error("[pauseEldoradoOffer] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function resumeEldoradoOffer(offerId) {
    if (!offerId) return { success: false, error: "offerId is required" };
    try {
        await fetchEldorado(`/v1/item-management/me/offers/${offerId}/resume`, {
            method: "POST",
        });
        return { success: true };
    } catch (error) {
        console.error("[resumeEldoradoOffer] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function bulkPauseEldoradoOffers(body) {
    try {
        const data = await fetchEldorado("/v1/item-management/me/offers/pause", {
            method: "POST",
            body: JSON.stringify(body),
        });
        return { success: true, data };
    } catch (error) {
        console.error("[bulkPauseEldoradoOffers] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function bulkResumeEldoradoOffers(gameId, body) {
    if (!gameId) return { success: false, error: "gameId is required" };
    try {
        const data = await fetchEldorado(`/v1/item-management/me/offers/game/${gameId}/resume`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        return { success: true, data };
    } catch (error) {
        console.error("[bulkResumeEldoradoOffers] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function bulkDeleteEldoradoOffers(params = {}) {
    try {
        const searchParams = new URLSearchParams();
        if (params.offerState) searchParams.append("offerState", params.offerState);
        if (params.gameId) searchParams.append("gameId", params.gameId);
        if (params.category) searchParams.append("category", params.category);

        await fetchEldorado(`/v1/item-management/me/offers/delete?${searchParams.toString()}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        console.error("[bulkDeleteEldoradoOffers] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function updateEldoradoOfferPrice(offerId, priceBody) {
    if (!offerId) return { success: false, error: "offerId is required" };
    try {
        const data = await fetchEldorado(`/v1/item-management/me/offers/${offerId}/price`, {
            method: "PUT",
            body: JSON.stringify(priceBody),
        });
        return { success: true, data };
    } catch (error) {
        console.error("[updateEldoradoOfferPrice] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function updateEldoradoDeliveryTime(body) {
    try {
        const data = await fetchEldorado("/v1/item-management/me/offers/delivery-time", {
            method: "POST",
            body: JSON.stringify(body),
        });
        return { success: true, data };
    } catch (error) {
        console.error("[updateEldoradoDeliveryTime] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function bulkUpdateEldoradoPrice(gameId, body) {
    if (!gameId) return { success: false, error: "gameId is required" };
    try {
        const data = await fetchEldorado(`/v1/item-management/me/offers/game/${gameId}/price`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        return { success: true, data };
    } catch (error) {
        console.error("[bulkUpdateEldoradoPrice] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getEldoradoNotifications(cursorValue = "") {
    try {
        const defaultCursor = "9999-99-99 99:99:99.999999999999999-9999-9999-9999-999999999999";
        const cursor = cursorValue || defaultCursor;

        // Building the exact parameters Eldorado expects
        const params = new URLSearchParams();
        params.append("cursorValue", cursor);
        params.append("pageSize", "20");
        params.append("pageDirection", "Next");
        params.append("notificationReadStatuses", "IsUnread");
        params.append("notificationReadStatuses", "IsRead");

        const url = `/notifications/me?${params.toString()}`;
        const data = await fetchEldorado(url);
        return { success: true, data: data };
    } catch (error) {
        console.error("[getEldoradoNotifications] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getUnreadNotificationCount() {
    try {
        const data = await fetchEldorado(`/notifications/me/unreadCount`);
        return { success: true, count: data?.unreadNotificationCount || 0 };
    } catch (error) {
        console.error("[getUnreadNotificationCount] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function markNotificationAsRead(notificationId) {
    if (!notificationId) return { success: false, error: "No notification ID" };
    try {
        const data = await fetchEldorado(`/notifications/me/${notificationId}/markAsRead`, {
            method: "PUT",
        });
        return { success: true, data };
    } catch (error) {
        console.error("[markNotificationAsRead] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        await fetchEldorado(`/notifications/me/markAllAsRead`, {
            method: "PUT",
        });
        return { success: true };
    } catch (error) {
        console.error("[markAllNotificationsAsRead] Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getEldoradoLibrary() {
    try {
        const response = await fetch("https://www.eldorado.gg/api/library?locale=en-US", {
            next: { revalidate: 3600 }, // Cache for 1 hour on the server
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch library: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("[getEldoradoLibrary] Error:", error.message);
        return { success: false, error: error.message, data: [] };
    }
}
