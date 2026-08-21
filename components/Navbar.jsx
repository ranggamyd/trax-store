"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, BookOpen, Clock, Gamepad2, List, LogOut, MessageSquare, Shield, ShoppingCart, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getEldoradoNotifications, getUnreadNotificationCount } from "@/app/actions";
import { TraxMark } from "@/components/illustrations/TraxMark";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokenRecovery } from "@/hooks/useTokenRecovery";
import { SPRING } from "@/lib/motion";
import { supabase } from "@/lib/supabase";

const POLL_INTERVAL_MS = 30000;
const AUTH_ROUTES = ["/login", "/reset-password"];

const PRIMARY_LINKS = [
    { name: "Games", href: "/games", icon: Gamepad2 },
    { name: "Accounts", href: "/accounts", icon: Users },
    { name: "Templates", href: "/templates", icon: MessageSquare },
    { name: "Users", href: "/users", icon: Shield },
    { name: "Shifts", href: "/shifts", icon: Clock },
];

const COMMERCE_LINKS = [
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Offers", href: "/offers", icon: List },
];

/** Label event Eldorado -> bahasa manusia. */
function labelForEvent(event) {
    if (event === "OrderCreated") return "Order baru masuk";
    if (event === "MessageReceived") return "Pesan baru";
    return event;
}

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const shouldReduceMotion = useReducedMotion();

    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotifs, setLatestNotifs] = useState([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Dipakai sebagai dependency, bukan `pathname` mentah. Ini yang benerin
    // kebocoran interval: dulu deps-nya `pathname`, jadi tiap pindah halaman
    // interval polling-nya dibongkar-pasang ulang. Sekarang boolean, jadi cuma
    // berubah waktu nyeberang batas login <-> app.
    const isAuthRoute = useMemo(() => AUTH_ROUTES.includes(pathname), [pathname]);

    const fetchUnreadRef = useRef(null);
    const { reportTokenExpired, reportTokenOk } = useTokenRecovery(useCallback(() => fetchUnreadRef.current?.(), []));

    const fetchUnread = useCallback(async () => {
        const res = await getUnreadNotificationCount();
        if (res.success) {
            setUnreadCount(res.count);
            reportTokenOk();
        } else if (res.error === "TOKEN_EXPIRED_401") {
            reportTokenExpired();
        }
    }, [reportTokenExpired, reportTokenOk]);

    useEffect(() => {
        fetchUnreadRef.current = fetchUnread;
    }, [fetchUnread]);

    useEffect(() => {
        if (isAuthRoute) return;

        fetchUnreadRef.current?.();

        // Skip polling waktu tab-nya gak kelihatan. Yang lama tetep nembak
        // server tiap 30 detik walau tab-nya ketinggal kebuka seharian.
        const tick = () => {
            if (document.visibilityState === "visible") fetchUnreadRef.current?.();
        };

        const interval = setInterval(tick, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [isAuthRoute]);

    const fetchLatestNotifs = useCallback(async () => {
        setIsLoadingNotifs(true);
        const res = await getEldoradoNotifications("");
        if (res.success && res.data?.results) {
            setLatestNotifs(res.data.results.slice(0, 10));
        } else if (res.error === "TOKEN_EXPIRED_401") {
            reportTokenExpired();
        }
        setIsLoadingNotifs(false);
    }, [reportTokenExpired]);

    useEffect(() => {
        if (!isPopoverOpen || isAuthRoute) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch waktu popover kebuka, setState-nya nyusul setelah await
        fetchLatestNotifs();
    }, [isPopoverOpen, isAuthRoute, fetchLatestNotifs]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Logout gagal", { description: "Coba sekali lagi ya." });
        } else {
            router.push("/login");
        }
    };

    if (isAuthRoute) return null;

    const renderNavButton = (link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
            <Link key={link.href} href={link.href} className="relative">
                {/* Pil aktif pakai layoutId, jadi dia MELUNCUR dari tab lama ke tab
                    baru ketimbang muncul-ilang. Gerakan itu yang ngasih tau mata
                    "lu pindah dari sini ke sini" tanpa perlu dibaca. */}
                {isActive && <motion.span layoutId="nav-active-pill" className="bg-primary/15 border-primary/30 absolute inset-0 rounded-full border" style={{ boxShadow: "var(--glow-primary)" }} transition={shouldReduceMotion ? { duration: 0 } : SPRING} />}
                <Button variant="ghost" className={`relative z-10 rounded-full text-sm font-medium transition-colors ${isActive ? "text-primary hover:bg-transparent" : "text-muted-foreground hover:text-foreground hover:bg-surface-3/60"}`}>
                    <Icon className="h-4 w-4 shrink-0 md:mr-2" />
                    <span className="hidden lg:inline">{link.name}</span>
                </Button>
            </Link>
        );
    };

    const renderIconLink = (href, Icon, label) => {
        const isActive = pathname === href;
        return (
            <Link href={href}>
                <Button variant="ghost" aria-label={label} title={label} className={`rounded-full px-3 transition-colors ${isActive ? "text-primary bg-primary/12" : "text-muted-foreground hover:text-foreground hover:bg-surface-3/60"}`}>
                    <Icon className="h-5 w-5" />
                </Button>
            </Link>
        );
    };

    return (
        <div className="sticky top-4 z-50 mx-auto mt-4 mb-2 w-full max-w-7xl px-4">
            <nav className="glass flex h-16 items-center rounded-full px-4 md:px-6">
                <Link href="/" className="mr-4 flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80 md:mr-8">
                    {/* Logo asli, bukan ikon gamepad dari icon set */}
                    <TraxMark className="h-7 w-7" />
                    <span className="text-brand hidden text-lg font-bold tracking-tight md:inline-block">Traxstore</span>
                </Link>

                <div className="no-scrollbar flex flex-1 items-center space-x-2 overflow-x-auto lg:space-x-3">
                    <div className="border-border/60 bg-surface-1/40 flex items-center space-x-1 rounded-full border px-2 py-1.5">{PRIMARY_LINKS.map(renderNavButton)}</div>
                    <div className="border-border/60 bg-surface-1/40 flex items-center space-x-1 rounded-full border px-2 py-1.5">{COMMERCE_LINKS.map(renderNavButton)}</div>
                </div>

                <div className="flex items-center justify-end gap-1 md:gap-2">
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" aria-label="Notifikasi" title="Notifikasi" className={`relative rounded-full px-3 transition-colors ${pathname === "/notifications" ? "text-primary bg-primary/12" : "text-muted-foreground hover:text-foreground hover:bg-surface-3/60"}`}>
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    // Yang lama pakai shadow-[0_0_10px_rgba(var(--primary),0.8)].
                                    // Itu CSS invalid: --primary isinya hex, bukan channel RGB,
                                    // jadi glow-nya diem-diem gak pernah ke-render.
                                    <span className="bg-danger text-danger-foreground absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold" style={{ boxShadow: "var(--glow-danger)" }}>
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="border-border/70 bg-popover/90 z-[100] mt-3 w-80 rounded-2xl p-0 shadow-2xl backdrop-blur-2xl sm:w-[360px]">
                            <div className="border-border/70 bg-surface-1/60 flex items-center justify-between border-b p-3.5">
                                <h4 className="text-sm font-semibold tracking-tight">Yang baru masuk</h4>
                                <Link href="/notifications" onClick={() => setIsPopoverOpen(false)} className="text-primary text-[11px] font-bold transition-opacity hover:opacity-80">
                                    Lihat semua
                                </Link>
                            </div>

                            <div className="custom-scrollbar flex max-h-[350px] flex-col overflow-y-auto">
                                {isLoadingNotifs ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="border-border/40 flex flex-col gap-2 border-b p-3.5">
                                            <Skeleton className="bg-surface-3 h-4 w-1/2" />
                                            <div className="mt-1 flex items-end justify-between">
                                                <Skeleton className="bg-surface-3 h-3 w-1/3" />
                                                <Skeleton className="bg-surface-3 h-4 w-12" />
                                            </div>
                                        </div>
                                    ))
                                ) : latestNotifs.length === 0 ? (
                                    <div className="px-6 py-12 text-center">
                                        <p className="text-foreground text-sm font-medium">Sepi, aman.</p>
                                        <p className="text-muted-foreground mt-1 text-xs">Notifikasi baru bakal nongol di sini duluan.</p>
                                    </div>
                                ) : (
                                    latestNotifs.map((notif) => {
                                        const n = notif.notification;
                                        if (!n) return null;
                                        const isUnread = n.notificationReadStatus !== "IsRead";

                                        return (
                                            <button
                                                key={n.id}
                                                type="button"
                                                className={`border-border/40 flex w-full flex-col gap-1.5 border-b p-3.5 text-left transition-colors ${isUnread ? "bg-primary/[0.06] hover:bg-primary/10" : "hover:bg-surface-2/60"}`}
                                                onClick={() => {
                                                    setIsPopoverOpen(false);
                                                    router.push("/notifications");
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2 overflow-hidden">
                                                    <span className={`min-w-0 flex-1 truncate text-xs leading-tight font-semibold ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                                                        {labelForEvent(n.event)}
                                                        {n.details?.title && <span className="ml-1 font-normal opacity-80">— {n.details.title}</span>}
                                                    </span>
                                                    {isUnread && <span className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" style={{ boxShadow: "var(--glow-primary)" }} />}
                                                </div>
                                                <div className="mt-1 flex items-end justify-between">
                                                    <span className="text-muted-foreground font-mono text-[10px]">{n.details?.buyerUsername ? `Buyer: ${n.details.buyerUsername}` : "Notifikasi"}</span>
                                                    {n.details?.price && n.details.price.amount > 0 && <span className="border-success/25 bg-success/12 text-success rounded border px-1.5 py-0.5 text-[10px] font-bold">${n.details.price.amount.toFixed(2)}</span>}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="border-border/70 bg-surface-1/60 border-t p-2.5 text-center">
                                <Link href="/notifications" onClick={() => setIsPopoverOpen(false)} className="text-muted-foreground hover:text-foreground block w-full text-xs transition-colors">
                                    Buka pusat notifikasi
                                </Link>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {renderIconLink("/guide", BookOpen, "Panduan & Setup")}
                    {renderIconLink("/profile", User, "Profil")}

                    <Button variant="ghost" aria-label="Logout" title="Logout" className="text-danger hover:bg-danger/10 hover:text-danger rounded-full px-3 transition-colors" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </nav>
        </div>
    );
}
