"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Talk from "talkjs";

import { cancelOrder, getEldoradoOrderDetails, getEldoradoOrders, getTalkJsToken, markOrderDelivered } from "@/app/actions";
import { PageContainer } from "@/components/templates/PageContainer";
import { useTokenRecovery } from "@/hooks/useTokenRecovery";

import OrderDetail from "./components/OrderDetail";
import OrderList from "./components/OrderList";

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

    // Token recovery: selama extension ada & Eldorado masih login, retry terus sampe token kejemput
    const fetchOrdersRef = useRef(null);
    const { tokenStatus, tokenFailure, retryCount, reportTokenExpired, reportTokenOk } = useTokenRecovery(useCallback(() => fetchOrdersRef.current?.("", false, true), []));

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
                reportTokenOk();
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
            } else if (res.error === "TOKEN_EXPIRED_401") {
                // Jangan langsung teriak error: serahin ke recovery, dia yang nentuin bisa ditolong apa nggak
                setApiError(null);
                reportTokenExpired();
            } else {
                setApiError(res.error);
                // toast.error("Gagal ambil order: " + res.error);
            }
        },
        [searchQuery, orderStateFilter, reportTokenExpired, reportTokenOk]
    );

    useEffect(() => {
        fetchOrdersRef.current = fetchOrders;
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

    // Fetch TalkJS token for Live Chat; dicoba lagi tiap token Eldorado udah bener
    useEffect(() => {
        if (talkData || tokenStatus !== "ok") return;

        getTalkJsToken().then((res) => {
            if (res && res.success) {
                setTalkData(res);
            } else if (res && res.error === "TOKEN_EXPIRED_401") {
                reportTokenExpired();
            }
        });
    }, [talkData, tokenStatus, reportTokenExpired]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const openId = urlParams.get("openOrderId");

        if (openId && !searchQuery) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link ?openOrderId= cuma bisa dibaca setelah mount
            setSearchInput(openId);
            setSearchQuery(openId);
            setActiveOrderId(openId);
            return; // will re-trigger effect when fetchOrders changes due to searchQuery update
        }

        fetchOrders();

        // Auto-Polling Realtime for Orders List (Every 15s)
        const interval = setInterval(() => {
            // Don't append, just refresh from top silently
            fetchOrders("", false, true);
        }, 15000);

        return () => clearInterval(interval);
        // searchQuery udah kebawa lewat identitas fetchOrders, ditulis eksplisit biar lint tenang
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

    // Nandain order mana yang detail-nya paling terakhir diminta
    const detailRequestRef = useRef(null);

    const loadOrderDetails = useCallback(
        async (silent = false) => {
            if (!activeOrderId) return;

            const requestedId = activeOrderId;
            detailRequestRef.current = requestedId;

            if (!silent) {
                // Buang detail order sebelumnya DULUAN. Kalau ga, selama request jalan
                // panel masih megang data order lama sementara header udah ganti order baru.
                setActiveOrderFullDetails(null);
                setIsLoadingOrderDetails(true);
            }

            const res = await getEldoradoOrderDetails(requestedId);

            // Klik cepet A lalu B bisa bikin response A nyampe belakangan dan nimpa B.
            // Abaikan response yang udah ga relevan.
            if (detailRequestRef.current !== requestedId) return;

            if (!silent) setIsLoadingOrderDetails(false);

            if (res.success) {
                setActiveOrderFullDetails(res.data);
            } else {
                if (res.error === "TOKEN_EXPIRED_401") reportTokenExpired();
                setActiveOrderFullDetails(null);
            }
        },
        [activeOrderId, reportTokenExpired]
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data, loading flag-nya sengaja di-set biar spinner langsung nongol
        loadOrderDetails();
        // tokenStatus ikut dipantau biar detail-nya ke-load ulang begitu token baru masuk
    }, [loadOrderDetails, tokenStatus]);

    async function handleMarkDelivered(e) {
        e?.preventDefault();
        if (!activeOrderId) return;
        setIsDelivering(true);
        const result = await markOrderDelivered(activeOrderId);
        setIsDelivering(false);

        if (result.success) {
            // toast.success("Order ditandai terkirim", { description: "Statusnya udah keupdate di Eldorado." });
            setActiveOrders((prev) => prev.map((o) => (o.id === activeOrderId ? { ...o, status: "Delivered" } : o)));
            loadOrderDetails(true); // Silent reload
        } else {
            // toast.error(result.error || "Waduh gagal update status bro.");
        }
    }

    async function handleCancelOrder(e) {
        e?.preventDefault();
        if (!activeOrderId) return;
        setIsCanceling(true);
        const result = await cancelOrder(activeOrderId, cancelReason, cancelMessage);
        setIsCanceling(false);

        if (result.success) {
            // toast.success("Order dibatalin", { description: "Buyer bakal dapet notifikasi dari Eldorado." });
            setCancelMessage("");
            setCancelReason("Buyer_Provided_Incorrect_Information");
            setIsCancelDialogOpen(false);
            setActiveOrders((prev) => prev.map((o) => (o.id === activeOrderId ? { ...o, status: "Canceled" } : o)));
            loadOrderDetails(true); // Silent reload
        } else {
            // toast.error(result.error || "Gagal cancel order bro.");
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
        <PageContainer width="wide" innerClassName="flex h-[80vh] w-full flex-col gap-6 md:flex-row">
            <OrderList activeOrderList={activeOrderList} activeOrderId={activeOrderId} setActiveOrderId={setActiveOrderId} isLoadingOrders={isLoadingOrders} fetchOrders={fetchOrders} apiError={apiError} tokenStatus={tokenStatus} tokenFailure={tokenFailure} tokenRetryCount={retryCount} searchInput={searchInput} setSearchInput={setSearchInput} handleSearchSubmit={handleSearchSubmit} openFilter={openFilter} setOpenFilter={setOpenFilter} orderStateFilter={orderStateFilter} setOrderStateFilter={setOrderStateFilter} handleScroll={handleScroll} isFetchingNextPage={isFetchingNextPage} hasNextPage={hasNextPage} chatPreviews={chatPreviews} />

            <OrderDetail activeOrderId={activeOrderId} activeOrderDetails={activeOrderDetails} activeOrderFullDetails={activeOrderFullDetails} isLoadingOrderDetails={isLoadingOrderDetails} handleMarkDelivered={handleMarkDelivered} isDelivering={isDelivering} handleCancelOrder={handleCancelOrder} isCanceling={isCanceling} cancelReason={cancelReason} setCancelReason={setCancelReason} cancelMessage={cancelMessage} setCancelMessage={setCancelMessage} isCancelDialogOpen={isCancelDialogOpen} setIsCancelDialogOpen={setIsCancelDialogOpen} talkData={talkData} robloxUsernames={robloxUsernames} />
        </PageContainer>
    );
}
