"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import Talk from "talkjs";
import { markOrderDelivered, cancelOrder, getEldoradoOrders, getEldoradoOrderDetails, getTalkJsToken } from "@/app/actions";
import OrderList from "./components/OrderList";
import OrderDetail from "./components/OrderDetail";

export default function OrdersPage() {
    const [activeOrders, setActiveOrders] = useState([]);
    const [activeOrderId, setActiveOrderId] = useState(null);

    const [isCanceling, setIsCanceling] = useState(false);
    const [cancelReason, setCancelReason] = useState("Buyer_Provided_Incorrect_Information");
    const [cancelMessage, setCancelMessage] = useState("");

    const [isDelivering, setIsDelivering] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
    const [activeOrderFullDetails, setActiveOrderFullDetails] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [talkData, setTalkData] = useState(null);
    const [chatPreviews, setChatPreviews] = useState({}); // { conversationId: { lastMessage, unreadCount, timestamp } }
    const talkSessionRef = useRef(null);

    // Filter & Pagination States
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [orderStateFilter, setOrderStateFilter] = useState("");
    const [openFilter, setOpenFilter] = useState(false);
    const [cursorValue, setCursorValue] = useState(null);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);

    // Safeguard: Ensure activeOrders is treated as an array before calling .find()
    const activeOrderList = Array.isArray(activeOrders) ? activeOrders : [];
    const activeOrderDetails = activeOrderList.find((o) => o.id === activeOrderId) || null;

    const fetchOrders = useCallback(
        async (cursor = "", append = false, silent = false) => {
            if (append) setIsFetchingNextPage(true);
            else if (!silent) setIsLoadingOrders(true);

            const res = await getEldoradoOrders({
                query: searchQuery,
                orderState: orderStateFilter,
                cursorValue: cursor,
            });

            if (append) setIsFetchingNextPage(false);
            else if (!silent) setIsLoadingOrders(false);

            if (res.success) {
                setApiError(null);
                // The API returns the results array inside res.data based on our action mapping
                const orderData = Array.isArray(res.data) ? res.data : [];

                if (append) {
                    setActiveOrders((prev) => {
                        const prevIds = new Set(prev.map((o) => o.id));
                        const uniqueNewOrders = [];
                        for (const o of orderData) {
                            if (!prevIds.has(o.id)) {
                                uniqueNewOrders.push(o);
                                prevIds.add(o.id);
                            }
                        }
                        return [...prev, ...uniqueNewOrders];
                    });
                } else if (silent) {
                    setActiveOrders((prev) => {
                        const prevMap = new Map(prev.map((o) => [o.id, o]));
                        const newItems = [];
                        for (const o of orderData) {
                            if (prevMap.has(o.id)) {
                                prevMap.set(o.id, o); // update existing
                            } else {
                                newItems.push(o); // new item at top
                            }
                        }
                        return [...newItems, ...Array.from(prevMap.values())];
                    });
                } else {
                    setActiveOrders(orderData);
                    if (orderData.length > 0) {
                        setActiveOrderId((prevId) => (prevId ? prevId : orderData[0].id));
                    } else {
                        setActiveOrderId(null);
                    }
                }

                // Update cursor for infinite scroll
                setCursorValue(res.nextPageCursor);
                setHasNextPage(!!res.nextPageCursor && orderData.length > 0);
            } else {
                setApiError(res.error);
                if (res.error === "TOKEN_EXPIRED_401") {
                    // toast.info("Token basi! TraxStore lagi minta tolong Extension buat nyari token baru diem-diem...", { duration: 8000 });
                    window.postMessage({ type: "TRAX_FORCE_REFRESH" }, "*");
                } else {
                    toast.error("Gagal narik pesanan: " + res.error);
                }
            }
        },
        [searchQuery, orderStateFilter]
    );

    // Listen for successful token refresh from Chrome Extension
    useEffect(() => {
        const handleMessage = async (event) => {
            if (event.data?.type === "TRAX_TOKEN_REFRESHED") {
                if (event.data.token) {
                    await fetch("/api/sync-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: event.data.token }),
                    });
                }
                // toast.success("🔥 Token berhasil dicolong otomatis! Nge-refresh pesanan...");
                fetchOrders("", false);
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [fetchOrders]);

    // Init TalkJS session for unreads tracking
    useEffect(() => {
        if (!talkData || talkSessionRef.current) return;

        Talk.ready.then(() => {
            const me = new Talk.User({ id: talkData.userId, name: "Me" });
            const session = new Talk.Session({
                appId: process.env.NEXT_PUBLIC_TALKJS_APP_ID,
                me: me,
                tokenFetcher: () => talkData.token,
            });

            talkSessionRef.current = session;

            // Subscribe to unreads for chat previews
            session.unreads.onChange((unreads) => {
                const previews = {};
                for (const convo of unreads) {
                    previews[convo.conversation.id] = {
                        lastMessage: convo.lastMessage?.body || "",
                        senderName: convo.lastMessage?.sender?.name || "",
                        senderId: convo.lastMessage?.senderId || "",
                        unreadCount: convo.unreadMessageCount || 0,
                        timestamp: convo.lastMessage?.timestamp || 0,
                    };
                }
                setChatPreviews(previews);
            });
        });

        return () => {
            if (talkSessionRef.current) {
                talkSessionRef.current.destroy();
                talkSessionRef.current = null;
            }
        };
    }, [talkData]);

    useEffect(() => {
        // Fetch TalkJS token for Live Chat
        getTalkJsToken().then((res) => {
            if (res && res.success) {
                setTalkData(res);
            } else if (res && res.error === "TOKEN_EXPIRED_401") {
                window.postMessage({ type: "TRAX_FORCE_REFRESH" }, "*");
            }
        });

        const urlParams = new URLSearchParams(window.location.search);
        const openId = urlParams.get("openOrderId");

        if (openId && !searchQuery) {
            const timeoutId = setTimeout(() => {
                setSearchInput(openId);
                setSearchQuery(openId);
                setActiveOrderId(openId);
            }, 0);
            return () => clearTimeout(timeoutId);
        }

        const timeoutId = setTimeout(() => {
            fetchOrders();
        }, 0);

        // Auto-Polling Realtime for Orders List (Every 15s)
        const interval = setInterval(() => {
            // Don't append, just refresh from top silently
            fetchOrders("", false, true);
        }, 15000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, [fetchOrders, searchQuery]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Load more when user scrolls within 50px of bottom
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (cursorValue && hasNextPage && !isFetchingNextPage && !isLoadingOrders) {
                fetchOrders(cursorValue, true);
            }
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput); // Trigger fetchOrders
    };



    const loadOrderDetails = useCallback(
        async (silent = false) => {
            if (!activeOrderId) return;

            if (!silent) setIsLoadingOrderDetails(true);
            const res = await getEldoradoOrderDetails(activeOrderId);
            if (!silent) setIsLoadingOrderDetails(false);

            if (res.success) {
                setActiveOrderFullDetails(res.data);
            } else {
                setActiveOrderFullDetails(null);
            }
        },
        [activeOrderId]
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadOrderDetails();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [loadOrderDetails]);

    async function handleMarkDelivered(e) {
        e?.preventDefault();
        if (!activeOrderId) return;
        setIsDelivering(true);
        const result = await markOrderDelivered(activeOrderId);
        setIsDelivering(false);

        if (result.success) {
            toast.success("Cakep! Pesanan udah ditandai terkirim ke Eldorado.");
            setActiveOrders((prev) => prev.map((o) => (o.id === activeOrderId ? { ...o, status: "Delivered" } : o)));
            loadOrderDetails(true); // Silent reload
        } else {
            toast.error(result.error || "Waduh gagal update status bro.");
        }
    }

    async function handleCancelOrder(e) {
        e?.preventDefault();
        if (!activeOrderId) return;
        setIsCanceling(true);
        const result = await cancelOrder(activeOrderId, cancelReason, cancelMessage);
        setIsCanceling(false);

        if (result.success) {
            toast.success("Order berhasil di-cancel!");
            setCancelMessage("");
            setCancelReason("Buyer_Provided_Incorrect_Information");
            setIsCancelDialogOpen(false);
            setActiveOrders((prev) => prev.map((o) => (o.id === activeOrderId ? { ...o, status: "Canceled" } : o)));
            loadOrderDetails(true); // Silent reload
        } else {
            toast.error(result.error || "Gagal cancel order bro.");
        }
    }

    const raw = activeOrderFullDetails?.raw || {};

    let robloxUsernames = [];
    if (Array.isArray(raw.deliveryDetails)) {
        raw.deliveryDetails.forEach((d) => {
            if ((d.type === "RobloxUsername" || d.name === "RobloxUsername") && typeof d.value === "string") {
                robloxUsernames.push(...d.value.split(/\s+/).filter(Boolean));
            }
        });
    }

    return (
        <div className="text-foreground bg-black p-4 pb-20 md:p-8">
            <div className="mx-auto flex h-[80vh] w-full max-w-7xl flex-col gap-6 md:flex-row">
                <OrderList activeOrderList={activeOrderList} activeOrderId={activeOrderId} setActiveOrderId={setActiveOrderId} isLoadingOrders={isLoadingOrders} fetchOrders={fetchOrders} apiError={apiError} searchInput={searchInput} setSearchInput={setSearchInput} handleSearchSubmit={handleSearchSubmit} openFilter={openFilter} setOpenFilter={setOpenFilter} orderStateFilter={orderStateFilter} setOrderStateFilter={setOrderStateFilter} handleScroll={handleScroll} isFetchingNextPage={isFetchingNextPage} hasNextPage={hasNextPage} chatPreviews={chatPreviews} talkUserId={talkData?.userId} />

                <OrderDetail activeOrderId={activeOrderId} activeOrderDetails={activeOrderDetails} activeOrderFullDetails={activeOrderFullDetails} isLoadingOrderDetails={isLoadingOrderDetails} handleMarkDelivered={handleMarkDelivered} isDelivering={isDelivering} handleCancelOrder={handleCancelOrder} isCanceling={isCanceling} cancelReason={cancelReason} setCancelReason={setCancelReason} cancelMessage={cancelMessage} setCancelMessage={setCancelMessage} isCancelDialogOpen={isCancelDialogOpen} setIsCancelDialogOpen={setIsCancelDialogOpen} talkData={talkData} robloxUsernames={robloxUsernames} />
            </div>
        </div>
    );
}
