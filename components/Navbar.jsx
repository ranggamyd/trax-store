"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gamepad2, Users, Package, LogOut, Shield, User, MessageSquare, ShoppingCart, List, Bell, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getUnreadNotificationCount, getEldoradoNotifications } from "@/app/actions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotifs, setLatestNotifs] = useState([]);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        if (pathname === "/login" || pathname === "/reset-password") return;

        async function fetchUnread() {
            const res = await getUnreadNotificationCount();
            if (res.success) {
                setUnreadCount(res.count);
            } else if (res.error === "TOKEN_EXPIRED_401") {
                window.postMessage({ type: "TRAX_FORCE_REFRESH" }, "*");
            }
        }

        fetchUnread();

        // Poll every 30 seconds
        const interval = setInterval(fetchUnread, 30000);

        // Listen for extension auto-refresh
        const handleMessage = async (event) => {
            if (event.data?.type === "TRAX_TOKEN_REFRESHED") {
                if (event.data.token) {
                    await fetch("/api/sync-token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: event.data.token }),
                    });
                }
                fetchUnread();
            }
        };
        window.addEventListener("message", handleMessage);

        return () => {
            clearInterval(interval);
            window.removeEventListener("message", handleMessage);
        };
    }, [pathname]);

    const fetchLatestNotifs = async () => {
        if (pathname === "/login" || pathname === "/reset-password") return;
        setIsLoadingNotifs(true);
        const res = await getEldoradoNotifications("");
        if (res.success && res.data?.results) {
            setLatestNotifs(res.data.results.slice(0, 10)); // Top 10
        } else if (res.error === "TOKEN_EXPIRED_401") {
            window.postMessage({ type: "TRAX_FORCE_REFRESH" }, "*");
        }
        setIsLoadingNotifs(false);
    };

    useEffect(() => {
        if (isPopoverOpen) {
            fetchLatestNotifs();
        }
    }, [isPopoverOpen]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Gagal logout bro!");
        } else {
            router.push("/login");
        }
    };

    const group1 = [
        { name: "Game", href: "/games", icon: Gamepad2 },
        { name: "Akun", href: "/accounts", icon: Users },
        { name: "Item", href: "/items", icon: Package },
        { name: "Templates", href: "/templates", icon: MessageSquare },
        { name: "Admin", href: "/users", icon: Shield },
    ];

    const group2 = [
        { name: "Order", href: "/orders", icon: ShoppingCart },
        { name: "Offers", href: "/offers", icon: List },
    ];

    if (pathname === "/login" || pathname === "/reset-password") return null;

    const renderNavButton = (link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
            <Link key={link.href} href={link.href}>
                <Button variant="ghost" className={`rounded-full text-sm font-medium transition-colors ${isActive ? "border border-yellow-500/30 bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"}`}>
                    <Icon className="h-4 w-4 shrink-0 md:mr-2" />
                    <span className="hidden lg:inline">{link.name}</span>
                </Button>
            </Link>
        );
    };

    return (
        <div className="sticky top-6 z-50 mx-auto mt-6 mb-2 w-full max-w-6xl px-4">
            <nav className="flex h-16 items-center rounded-full border border-zinc-800 bg-black/60 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-xl md:px-6">
                <Link href="/" className="mr-4 flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80 md:mr-8">
                    <Gamepad2 className="text-primary h-6 w-6" />
                    <span className="neon-text-primary hidden text-xl font-bold tracking-widest uppercase md:inline-block">Traxstore</span>
                </Link>

                <div className="no-scrollbar flex flex-1 items-center space-x-2 overflow-x-auto lg:space-x-3">
                    <div className="flex items-center space-x-1 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-2 py-1.5">{group1.map(renderNavButton)}</div>
                    <div className="flex items-center space-x-1 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-2 py-1.5">{group2.map(renderNavButton)}</div>
                </div>
                <div className="flex items-center justify-end gap-1 md:gap-2">
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className={`relative rounded-full px-3 text-zinc-400 hover:bg-zinc-800/50 hover:text-white ${pathname === "/notifications" ? "bg-zinc-800 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : ""}`} title="Notifications">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.6)]">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="z-[100] mt-4 w-80 rounded-xl border-zinc-800 bg-black/90 p-0 shadow-2xl backdrop-blur-xl sm:w-[350px]">
                            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 p-3.5">
                                <h4 className="text-sm font-bold tracking-wide">Notifikasi Terbaru</h4>
                                <Link href="/notifications" onClick={() => setIsPopoverOpen(false)} className="text-primary text-[11px] font-bold hover:underline">
                                    View all
                                </Link>
                            </div>
                            <div className="custom-scrollbar flex max-h-[350px] flex-col overflow-y-auto">
                                {isLoadingNotifs ? (
                                    <div className="flex flex-col">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex flex-col gap-2 border-b border-zinc-800/40 p-3.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                                                </div>
                                                <div className="mt-1 flex items-end justify-between">
                                                    <Skeleton className="h-3 w-1/3 bg-zinc-800" />
                                                    <Skeleton className="h-4 w-12 bg-zinc-800" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : latestNotifs.length === 0 ? (
                                    <div className="py-10 text-center text-xs text-zinc-500">Belum ada notif terbaru.</div>
                                ) : (
                                    latestNotifs.map((notif) => {
                                        const n = notif.notification;
                                        if (!n) return null;
                                        const isUnread = n.notificationReadStatus !== "IsRead";

                                        return (
                                            <div
                                                key={n.id}
                                                className={`flex cursor-pointer flex-col gap-1.5 border-b border-zinc-800/40 p-3.5 transition-colors ${isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-zinc-900/40"}`}
                                                onClick={() => {
                                                    setIsPopoverOpen(false);
                                                    router.push("/notifications");
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2 overflow-hidden">
                                                    <span className={`min-w-0 flex-1 truncate text-xs leading-tight font-bold ${isUnread ? "text-zinc-100" : "text-zinc-400"}`}>
                                                        {n.event === "OrderCreated" ? "New Order" : n.event === "MessageReceived" ? "New Message" : n.event}
                                                        {n.details?.title && <span className="ml-1 font-normal opacity-80">- {n.details.title}</span>}
                                                    </span>
                                                    {isUnread && <span className="bg-primary mt-0.5 h-2 w-2 shrink-0 rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>}
                                                </div>
                                                <div className="mt-1 flex items-end justify-between">
                                                    <span className="font-mono text-[10px] text-zinc-500">{n.details?.buyerUsername ? `Buyer: ${n.details.buyerUsername}` : "Notification"}</span>
                                                    {n.details?.price && n.details.price.amount > 0 && <span className="rounded border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold text-green-400">${n.details.price.amount.toFixed(2)}</span>}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="border-t border-zinc-800/80 bg-zinc-950/90 p-2.5 text-center">
                                <Link href="/notifications" onClick={() => setIsPopoverOpen(false)} className="block w-full text-xs text-zinc-400 transition-colors hover:text-white">
                                    Buka Halaman Notifikasi Lengkap
                                </Link>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Link href="/guide">
                        <Button variant="ghost" className={`rounded-full px-3 text-zinc-400 hover:bg-zinc-800/50 hover:text-white ${pathname === "/guide" ? "bg-zinc-800 text-white" : ""}`} title="Panduan & Setup">
                            <BookOpen className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/profile">
                        <Button variant="ghost" className={`rounded-full px-3 text-zinc-400 hover:bg-zinc-800/50 hover:text-white ${pathname === "/profile" ? "bg-zinc-800 text-white" : ""}`} title="Profile">
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Button variant="ghost" className="rounded-full px-3 text-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={handleLogout} title="Logout">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </nav>
        </div>
    );
}
