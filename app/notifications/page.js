"use client";

import { AlertCircleIcon, BellIcon, CheckCircle2Icon, Loader2Icon, MessageSquareIcon, RefreshCwIcon, ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getEldoradoNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
            return <ShoppingCartIcon className="text-success h-5 w-5" />;
        case "OrderDelivered":
        case "OrderCompleted":
            return <CheckCircle2Icon className="text-accent h-5 w-5" />;
        case "OrderDisputed":
        case "OrderCanceled":
            return <AlertCircleIcon className="text-danger h-5 w-5" />;
        case "MessageReceived":
            return <MessageSquareIcon className="text-warning h-5 w-5" />;
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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data, loading flag-nya sengaja di-set biar spinner langsung nongol
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
        <PageContainer width="narrow" innerClassName="flex flex-col gap-6">
            {/* Header Section */}
            <div className="border-border bg-surface-2/50 relative overflow-hidden rounded-2xl border p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-r via-transparent to-transparent"></div>
                <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 border-primary/30 rounded-xl border p-3 shadow-[var(--glow-primary)]">
                            <BellIcon className="text-primary h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-glow-primary text-2xl font-bold tracking-widest uppercase">Notifikasi</h1>
                            <p className="text-muted-foreground text-sm font-medium">Pantau terus update lapak lu bro!</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => fetchNotifications()} disabled={isLoading} variant="ghost" size="icon" className="border-border text-muted-foreground hover:bg-surface-3 hover:text-foreground border" title="Refresh Notifications">
                            <RefreshCwIcon className={`h-4 w-4 ${isLoading ? "text-primary animate-spin" : ""}`} />
                        </Button>
                        <Button onClick={handleMarkAllAsRead} disabled={isMarkingAll || notifications.length === 0} className="border-border bg-surface-3 text-foreground/85 hover:bg-surface-3 hover:text-foreground border shadow-md transition-all">
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
                            <div key={i} className="border-border bg-surface-1/50 flex gap-4 rounded-xl border p-4">
                                <Skeleton className="bg-surface-3 h-10 w-10 shrink-0 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="bg-surface-3 h-5 w-1/3" />
                                    <Skeleton className="bg-surface-3 h-4 w-1/2" />
                                    <Skeleton className="bg-surface-3 mt-2 h-3 w-1/4" />
                                </div>
                                <div className="flex min-w-[80px] flex-col items-end justify-between">
                                    <Skeleton className="bg-surface-3 h-4 w-16" />
                                    <Skeleton className="bg-surface-3 h-4 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="border-border/50 bg-surface-2/20 text-muted-foreground flex flex-col items-center justify-center rounded-2xl border border-dashed py-20">
                        <div className="bg-surface-2 mb-4 rounded-full p-4 opacity-50">
                            <BellIcon className="text-muted-foreground/70 h-12 w-12" />
                        </div>
                        <p className="text-lg font-bold">Kosong Melompong</p>
                        <p className="text-sm">Belum ada notif masuk buat lu.</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
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
                            <div key={n.id} onClick={() => handleNotificationClick(notif)} className={`group relative flex cursor-pointer gap-4 overflow-hidden rounded-xl border p-4 transition-all duration-300 ${isUnread ? "border-primary/40 hover:border-primary bg-surface-2/80 shadow-[var(--glow-primary)] hover:shadow-[var(--glow-primary)]" : "border-border bg-surface-1/50 hover:border-border hover:bg-surface-2/80"}`}>
                                {isUnread && <div className="bg-primary/80 absolute top-0 bottom-0 left-0 w-1 shadow-[var(--glow-primary)]"></div>}

                                <div className="shrink-0 pt-1">
                                    <div className={`flex items-center justify-center rounded-full p-2.5 ${isUnread ? "bg-surface-3/80" : "bg-surface-2"}`}>{getEventIcon(n.event)}</div>
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <div className="mb-1 flex items-center gap-3">
                                        <h3 className={`text-[15px] font-bold ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>{mainTitle}</h3>
                                        <span className="text-muted-foreground text-xs whitespace-nowrap">{time}</span>
                                    </div>

                                    {subTitle && <p className={`text-[13px] ${isUnread ? "text-foreground/85" : "text-muted-foreground"}`}>{subTitle}</p>}

                                    {customText && <p className="text-muted-foreground line-clamp-2 text-[13px]">{customText}</p>}

                                    {n.details && n.details.buyerUsername && (
                                        <div className="text-muted-foreground mt-1 text-[13px]">
                                            Buyer: <span className={isUnread ? "text-foreground font-bold" : "text-muted-foreground font-bold"}>{n.details.buyerUsername}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex min-w-[80px] shrink-0 flex-col items-end justify-between">
                                    {isUnread ? (
                                        <button onClick={(e) => handleMarkAsRead(e, n.id)} className="text-muted-foreground hover:text-foreground/85 pb-2 text-xs underline underline-offset-2 transition-colors">
                                            Mark as read
                                        </button>
                                    ) : (
                                        <div className="pb-2"></div>
                                    )}

                                    {n.details?.price && n.details.price.amount > 0 && <div className={`mt-auto text-sm ${isUnread ? "text-foreground/85" : "text-muted-foreground"}`}>${n.details.price.amount.toFixed(2)}</div>}
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
        </PageContainer>
    );
}
