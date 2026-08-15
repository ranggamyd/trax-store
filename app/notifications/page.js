"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getEldoradoNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2Icon, BellIcon, CheckCircle2Icon, AlertCircleIcon, ShoppingCartIcon, MessageSquareIcon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};

// Map event types to icons and colors
const getEventIcon = (event) => {
    switch (event) {
        case "OrderCreated":
        case "OrderPaid":
            return <ShoppingCartIcon className="h-5 w-5 text-green-400" />;
        case "OrderDelivered":
        case "OrderCompleted":
            return <CheckCircle2Icon className="h-5 w-5 text-blue-400" />;
        case "OrderDisputed":
        case "OrderCanceled":
            return <AlertCircleIcon className="h-5 w-5 text-red-400" />;
        case "MessageReceived":
            return <MessageSquareIcon className="h-5 w-5 text-yellow-400" />;
        default:
            return <BellIcon className="text-primary h-5 w-5" />;
    }
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    // Pagination States
    const [cursorValue, setCursorValue] = useState(null);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);

    const router = useRouter();

    const fetchNotifications = useCallback(async (cursor = "", append = false) => {
        if (append) setIsFetchingNextPage(true);
        else setIsLoading(true);

        const res = await getEldoradoNotifications(cursor);

        if (append) setIsFetchingNextPage(false);
        else setIsLoading(false);

        if (res.success && res.data?.results) {
            const data = res.data.results;
            if (append) {
                setNotifications((prev) => [...prev, ...data]);
            } else {
                setNotifications(data);
            }

            setCursorValue(res.data.nextPageCursor || null);
            setHasNextPage(!!res.data.nextPageCursor && data.length > 0);
        } else {
            toast.error(res.error || "Gagal narik notifikasi bro!");
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Infinite Scroll Handler
    useEffect(() => {
        const handleWindowScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            if (documentHeight - (scrollY + windowHeight) <= 150) {
                if (cursorValue && hasNextPage && !isFetchingNextPage && !isLoading) {
                    fetchNotifications(cursorValue, true);
                }
            }
        };

        window.addEventListener("scroll", handleWindowScroll);
        return () => window.removeEventListener("scroll", handleWindowScroll);
    }, [cursorValue, hasNextPage, isFetchingNextPage, isLoading, fetchNotifications]);

    const handleMarkAsRead = async (e, id) => {
        e.stopPropagation();
        const res = await markNotificationAsRead(id);
        if (res.success) {
            setNotifications((prev) => prev.map((n) => (n.notification.id === id ? { ...n, notification: { ...n.notification, notificationReadStatus: "IsRead" } } : n)));
        } else {
            toast.error("Gagal tandai dibaca");
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarkingAll(true);
        const res = await markAllNotificationsAsRead();
        setIsMarkingAll(false);

        if (res.success) {
            toast.success("Semua notifikasi ditandai dibaca!");
            setNotifications((prev) =>
                prev.map((n) => ({
                    ...n,
                    notification: { ...n.notification, notificationReadStatus: "IsRead" },
                }))
            );
        } else {
            toast.error("Gagal update status");
        }
    };

    const handleNotificationClick = (notif) => {
        const detailsId = notif.notification?.details?.detailsId;
        // Mark as read eagerly
        if (notif.notification?.notificationReadStatus !== "IsRead") {
            markNotificationAsRead(notif.notification.id);
            setNotifications((prev) => prev.map((n) => (n.notification.id === notif.notification.id ? { ...n, notification: { ...n.notification, notificationReadStatus: "IsRead" } } : n)));
        }

        if (detailsId) {
            router.push("/orders");
            toast.info(`Cek order ID: ${detailsId} di menu Orders`);
        }
    };

    return (
        <div className="text-foreground min-h-screen bg-black p-4 pb-20 md:p-8">
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                    <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-r via-transparent to-transparent"></div>
                    <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 border-primary/30 rounded-xl border p-3 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                <BellIcon className="text-primary h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="neon-text-primary text-2xl font-bold tracking-widest uppercase">Notifikasi</h1>
                                <p className="text-sm font-medium text-zinc-400">Pantau terus update lapak lu bro!</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => fetchNotifications()} disabled={isLoading} variant="ghost" size="icon" className="border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white" title="Refresh Notifications">
                                <RefreshCwIcon className={`h-4 w-4 ${isLoading ? "text-primary animate-spin" : ""}`} />
                            </Button>
                            <Button onClick={handleMarkAllAsRead} disabled={isMarkingAll || notifications.length === 0} className="border border-zinc-700 bg-zinc-800 text-zinc-300 shadow-md transition-all hover:bg-zinc-700 hover:text-white">
                                {isMarkingAll ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2Icon className="mr-2 h-4 w-4" />}
                                Mark all as read
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex flex-col gap-3">
                    {isLoading ? (
                        <div className="flex flex-col gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                                    <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-1/3 bg-zinc-800" />
                                        <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                                        <Skeleton className="mt-2 h-3 w-1/4 bg-zinc-800" />
                                    </div>
                                    <div className="flex min-w-[80px] flex-col items-end justify-between">
                                        <Skeleton className="h-4 w-16 bg-zinc-800" />
                                        <Skeleton className="h-4 w-12 bg-zinc-800" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800/50 bg-zinc-900/20 py-20 text-zinc-500">
                            <div className="mb-4 rounded-full bg-zinc-900 p-4 opacity-50">
                                <BellIcon className="h-12 w-12 text-zinc-600" />
                            </div>
                            <p className="text-lg font-bold">Kosong Melompong</p>
                            <p className="text-sm">Belum ada notif masuk buat lu.</p>
                        </div>
                    ) : (
                        notifications.map((notif, idx) => {
                            const n = notif.notification;
                            if (!n) return null;

                            const getEventDisplayTitle = (ev) => {
                                if (ev === "OrderCreated") return "New Order";
                                if (ev === "MessageReceived") return "New Message";
                                if (ev === "OrderDelivered") return "Order Delivered";
                                if (ev === "OrderCanceled") return "Order Canceled";
                                if (ev === "OrderPaid") return "Order Paid";
                                if (ev === "OrderDisputed") return "Order Disputed";
                                return ev || "Notification";
                            };

                            const isUnread = n.notificationReadStatus !== "IsRead";
                            const mainTitle = getEventDisplayTitle(n.event);
                            const subTitle = n.details?.title;
                            const time = formatRelativeTime(n.notificationDate);
                            const customText = notif.customNotification?.text;

                            return (
                                <div key={n.id} onClick={() => handleNotificationClick(notif)} className={`group relative flex cursor-pointer gap-4 overflow-hidden rounded-xl border p-4 transition-all duration-300 ${isUnread ? "border-primary/40 hover:border-primary bg-zinc-900/80 shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_0_20px_rgba(var(--primary),0.2)]" : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/80"}`}>
                                    {isUnread && <div className="bg-primary/80 absolute top-0 bottom-0 left-0 w-1 shadow-[0_0_10px_rgba(var(--primary),1)]"></div>}

                                    <div className="shrink-0 pt-1">
                                        <div className={`flex items-center justify-center rounded-full p-2.5 ${isUnread ? "bg-zinc-800/80" : "bg-zinc-900"}`}>{getEventIcon(n.event)}</div>
                                    </div>

                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <div className="mb-1 flex items-center gap-3">
                                            <h3 className={`text-[15px] font-bold ${isUnread ? "text-zinc-100" : "text-zinc-400"}`}>{mainTitle}</h3>
                                            <span className="text-xs whitespace-nowrap text-zinc-500">{time}</span>
                                        </div>

                                        {subTitle && <p className={`text-[13px] ${isUnread ? "text-zinc-300" : "text-zinc-500"}`}>{subTitle}</p>}

                                        {customText && <p className="line-clamp-2 text-[13px] text-zinc-400">{customText}</p>}

                                        {n.details && n.details.buyerUsername && (
                                            <div className="mt-1 text-[13px] text-zinc-500">
                                                Buyer: <span className={isUnread ? "font-bold text-zinc-200" : "font-bold text-zinc-400"}>{n.details.buyerUsername}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex min-w-[80px] shrink-0 flex-col items-end justify-between">
                                        {isUnread ? (
                                            <button onClick={(e) => handleMarkAsRead(e, n.id)} className="pb-2 text-xs text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-300">
                                                Mark as read
                                            </button>
                                        ) : (
                                            <div className="pb-2"></div>
                                        )}

                                        {n.details?.price && n.details.price.amount > 0 && <div className={`mt-auto text-sm ${isUnread ? "text-zinc-300" : "text-zinc-500"}`}>${n.details.price.amount.toFixed(2)}</div>}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {isFetchingNextPage && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2Icon className="text-primary h-6 w-6 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
