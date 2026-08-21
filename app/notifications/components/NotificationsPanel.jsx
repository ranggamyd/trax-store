"use client";

import { BellIcon, CheckCircle2Icon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getEldoradoNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions";
import { NotificationItem } from "@/app/notifications/components/NotificationItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Daftar notifikasi.
 *
 * TETAP CLIENT COMPONENT, dan itu keputusan sadar: paginasinya cursor-based
 * (infinite scroll), dan Eldorado ngasih `nextPageCursor` bukan nomor halaman.
 * Cursor gak bisa ditaro di URL dengan cara yang bermakna — link ke
 * "?cursor=eyJ..." gak stabil dan gak bisa dishare. Maksa jadi RSC di sini
 * bakal ngorbankan infinite scroll-nya tanpa dapet apa-apa.
 *
 * Yang diperbaiki: halaman aslinya 271 baris jadi satu blok. Sekarang render
 * barisnya pindah ke NotificationItem, dan yang tinggal di sini cuma urusan
 * data + scroll.
 */
const SCROLL_THRESHOLD_PX = 150;

export function NotificationsPanel() {
    const router = useRouter();

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [isFetchingNext, setIsFetchingNext] = useState(false);
    const [hasNext, setHasNext] = useState(true);

    const fetchPage = useCallback(async (nextCursor = "", { append = false, initial = false } = {}) => {
        // `initial` gak nyetel isLoading, karena state awalnya udah true.
        // Bukan cuma soal lint: nyetel ulang state ke nilai yang sama waktu
        // mount itu render tambahan yang gak ngasih apa-apa.
        if (append) setIsFetchingNext(true);
        else if (!initial) setIsLoading(true);

        const res = await getEldoradoNotifications(nextCursor);

        if (append) setIsFetchingNext(false);
        else setIsLoading(false);

        if (!res.success || !res.data?.results) {
            toast.error("Gagal narik notifikasi", { description: res.error ?? "Coba refresh sebentar lagi." });
            return;
        }

        const rows = res.data.results;
        setNotifications((prev) => (append ? [...prev, ...rows] : rows));
        setCursor(res.data.nextPageCursor || null);
        setHasNext(Boolean(res.data.nextPageCursor) && rows.length > 0);
    }, []);

    // Ref biar handler scroll gak perlu di-recreate tiap state berubah.
    const loadMoreRef = useRef(null);
    useEffect(() => {
        loadMoreRef.current = () => {
            if (cursor && hasNext && !isFetchingNext && !isLoading) fetchPage(cursor, { append: true });
        };
    }, [cursor, hasNext, isFetchingNext, isLoading, fetchPage]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch awal ke Eldorado (sistem eksternal). `initial: true` udah nyegah setState sinkron, tapi rule-nya gak bisa buktiin guard `if`-nya waktu nelusuri masuk ke fetchPage.
        fetchPage("", { initial: true });
    }, [fetchPage]);

    useEffect(() => {
        const onScroll = () => {
            const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
            if (remaining <= SCROLL_THRESHOLD_PX) loadMoreRef.current?.();
        };

        // passive: true — handler ini gak pernah manggil preventDefault, jadi
        // browser gak perlu nunggu dia sebelum ngegulir. Versi lama gak nyetel
        // ini, dan itu bikin scroll kerasa berat di halaman panjang.
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const markOneRead = (id) => {
        setNotifications((prev) => prev.map((row) => (row.notification?.id === id ? { ...row, notification: { ...row.notification, notificationReadStatus: "IsRead" } } : row)));

        markNotificationAsRead(id).then((res) => {
            if (!res?.success) toast.error("Gagal tandai dibaca", { description: "Statusnya bakal balik pas di-refresh." });
        });

        // Badge di Navbar baca dari server, jadi dia perlu dibilangin juga.
        router.refresh();
    };

    const markAllRead = async () => {
        setIsMarkingAll(true);
        const res = await markAllNotificationsAsRead();
        setIsMarkingAll(false);

        if (!res?.success) {
            toast.error("Gagal update status", { description: res?.error ?? "Coba lagi sebentar." });
            return;
        }

        setNotifications((prev) => prev.map((row) => ({ ...row, notification: { ...row.notification, notificationReadStatus: "IsRead" } })));
        toast.success("Semua notifikasi ditandai dibaca");
        router.refresh();
    };

    const openNotification = (notif) => {
        const n = notif.notification;
        if (n?.notificationReadStatus !== "IsRead") markOneRead(n.id);

        if (n?.details?.detailsId) router.push("/orders");
    };

    const unreadCount = notifications.filter((row) => row.notification?.notificationReadStatus !== "IsRead").length;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">{isLoading ? "Ngambil notifikasi..." : unreadCount > 0 ? `${unreadCount} belum kebaca` : "Semua udah kebaca"}</p>

                <div className="flex items-center gap-2">
                    <Button onClick={() => fetchPage()} disabled={isLoading} variant="outline" size="icon" aria-label="Muat ulang notifikasi" title="Muat ulang" className="h-9 w-9">
                        <RefreshCwIcon className={isLoading ? "text-primary h-4 w-4 animate-spin" : "h-4 w-4"} />
                    </Button>

                    <Button onClick={markAllRead} disabled={isMarkingAll || unreadCount === 0} variant="outline" className="h-9">
                        {isMarkingAll ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2Icon className="mr-2 h-4 w-4" />}
                        Tandai semua
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border-border bg-surface-1/50 flex gap-4 rounded-xl border p-4">
                            <Skeleton className="bg-surface-3 h-10 w-10 shrink-0 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="bg-surface-3 h-4 w-1/3" />
                                <Skeleton className="bg-surface-3 h-3 w-1/2" />
                            </div>
                            <Skeleton className="bg-surface-3 h-4 w-14 shrink-0" />
                        </div>
                    ))
                ) : notifications.length === 0 ? (
                    <div className="border-border/60 bg-surface-2/20 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
                        <div className="bg-surface-2 mb-4 rounded-full p-4">
                            <BellIcon className="text-muted-foreground/70 h-10 w-10" />
                        </div>
                        <p className="text-foreground text-base font-semibold">Sepi, aman.</p>
                        <p className="text-muted-foreground mt-1 text-sm">Order dan pesan baru bakal nongol di sini duluan.</p>
                    </div>
                ) : (
                    notifications.map((notif) => <NotificationItem key={notif.notification?.id} notif={notif} onOpen={openNotification} onMarkRead={markOneRead} />)
                )}

                {isFetchingNext && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2Icon className="text-primary h-5 w-5 animate-spin" />
                    </div>
                )}

                {!isLoading && !hasNext && notifications.length > 0 && <p className="text-muted-foreground py-4 text-center text-xs">Udah sampai paling bawah.</p>}
            </div>
        </div>
    );
}
