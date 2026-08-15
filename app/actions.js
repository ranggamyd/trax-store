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

export async function getEldoradoOrders(params = {}) {
    try {
        const { query = "", orderState = "", cursorValue = "", pageSize = 5 } = params;

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
            parsedOrders = data.results.map((order) => {
                // Roblox username biasanya dikirim via custom field atau chat,
                // tapi kita mapping aja kalau-kalau API-nya ngirim di `userRequestDetails` atau `deliveryDetails`
                const deliveryDetailRoblox = order.deliveryDetails?.find((d) => d.type === "RobloxUsername")?.value;
                const robloxUser = deliveryDetailRoblox || order.userRequestDetails?.robloxUsername || order.robloxUsername || null;

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
            });
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
        const deliveryDetailRoblox = order.deliveryDetails?.find((d) => d.type === "RobloxUsername")?.value;
        const robloxUser = deliveryDetailRoblox || order.userRequestDetails?.robloxUsername || order.robloxUsername || null;

        return {
            success: true,
            data: {
                id: order.id,
                buyer: order.buyerUsername,
                game: order.orderOfferDetails?.offerTitle || order.orderOfferDetails?.gameCategoryTitle || "Item",
                quantity: order.purchaseQuantity || 1,
                robloxUsername: robloxUser,
                status: order.state?.state,
                talkJsConversationId: order.talkJsConversationId,
                raw: order,
            },
        };
    } catch (error) {
        console.error(`[getEldoradoOrderDetails] Error for ${orderId}:`, error.message);
        return { success: false, error: error.message };
    }
}

export async function getEldoradoOffers(params = {}) {
    try {
        const { query = "", offerState = "", cursorValue = "", pageSize = 50 } = params;

        // According to Eldorado swagger: /api/v1/item-management/me/offers/me/search
        const searchParams = new URLSearchParams();
        searchParams.append("pageSize", pageSize.toString());

        if (query) searchParams.append("searchQuery", query); // swagger uses searchQuery
        // Add offerState if needed, assuming the API accepts it or we filter it later

        const data = await fetchEldorado(`/v1/item-management/me/offers/me/search?${searchParams.toString()}`);

        let parsedOffers = [];
        if (data && data.results && Array.isArray(data.results)) {
            parsedOffers = data.results.map((offer) => {
                return {
                    id: offer.id,
                    offerTitle: offer.offerTitle || "Item",
                    gameCategoryTitle: offer.gameCategoryTitle || "Game",
                    category: offer.category || "Category",
                    quantity: offer.quantity || 0,
                    pricePerUnit: offer.pricePerUnit || { amount: 0, currency: "USD" },
                    offerState: offer.offerState || "Unknown",
                    guaranteedDeliveryTime: offer.guaranteedDeliveryTime || "-",
                    description: offer.description || "",
                    raw: offer,
                };
            });
        }

        return {
            success: true,
            data: parsedOffers,
            nextPageCursor: data?.nextPageCursor || null,
        };
    } catch (error) {
        console.error("[getEldoradoOffers] Error:", error.message);
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
