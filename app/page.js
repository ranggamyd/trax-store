"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Users, Package, Clock, Play, Square, ArrowRightLeft, Timer, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getActiveShift, getShiftUsers, startShift, endShift, takeoverShift, getWeeklyShiftSummary } from "@/app/actions/shifts";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

function formatDuration(startedAt) {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.max(0, now - start);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDurationMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    if (hours === 0) return `${mins} menit`;
    return `${hours} jam ${mins} menit`;
}

export default function DashboardOverview() {
    const [stats, setStats] = useState({ games: 0, accounts: 0, items: 0 });
    const [activeShift, setActiveShift] = useState(null);
    const [shiftUsers, setShiftUsers] = useState([]);
    const [liveDuration, setLiveDuration] = useState("00:00:00");
    const [shiftLoading, setShiftLoading] = useState(true);

    // Weekly Summary State
    const [weeklySummary, setWeeklySummary] = useState([]);
    const [weeklyPeriodStart, setWeeklyPeriodStart] = useState("");
    const [weeklyPeriodEnd, setWeeklyPeriodEnd] = useState("");
    const [weekOffset, setWeekOffset] = useState(0);
    const [weeklyLoading, setWeeklyLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");

    async function fetchStats() {
        const [gamesRes, accountsRes, itemsRes] = await Promise.all([supabase.from("games").select("*", { count: "exact", head: true }), supabase.from("accounts").select("*", { count: "exact", head: true }), supabase.from("items").select("*", { count: "exact", head: true })]);

        setStats({
            games: gamesRes.count || 0,
            accounts: accountsRes.count || 0,
            items: itemsRes.count || 0,
        });
    }

    const fetchShiftData = useCallback(async () => {
        setShiftLoading(true);
        const [shiftRes, usersRes] = await Promise.all([getActiveShift(), getShiftUsers()]);
        if (shiftRes.shift) setActiveShift(shiftRes.shift);
        else setActiveShift(null);
        if (usersRes.users) setShiftUsers(usersRes.users);
        setShiftLoading(false);
    }, []);

    const { loading, session } = useAuthGuard(() => {
        fetchStats();
        fetchShiftData();
    });

    // Live timer for active shift
    useEffect(() => {
        if (!activeShift) {
            const timeoutId = setTimeout(() => setLiveDuration("00:00:00"), 0);
            return () => clearTimeout(timeoutId);
        }
        
        const timeoutId = setTimeout(() => {
            setLiveDuration(formatDuration(activeShift.started_at));
        }, 0);

        const interval = setInterval(() => {
            setLiveDuration(formatDuration(activeShift.started_at));
        }, 1000);
        
        return () => {
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, [activeShift]);

    const fetchWeeklySummary = useCallback(async () => {
        setWeeklyLoading(true);
        const res = await getWeeklyShiftSummary({ weekOffset });
        if (res.error) {
            toast.error(res.error);
        } else {
            setWeeklySummary(res.summary || []);
            setWeeklyPeriodStart(res.periodStart);
            setWeeklyPeriodEnd(res.periodEnd);
        }
        setWeeklyLoading(false);
    }, [weekOffset]);

    useEffect(() => {
        if (!session) return;
        const timeoutId = setTimeout(() => {
            fetchWeeklySummary();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [fetchWeeklySummary, session]);

    const handleStartShift = async () => {
        if (!selectedUserId) return toast.error("Pilih dulu siapa yang mau jaga!");
        setActionLoading(true);
        const res = await startShift(selectedUserId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Shift dimulai! Gas ngerjain order! 🔥");
            setStartDialogOpen(false);
            setSelectedUserId("");
            await fetchShiftData();
            await fetchWeeklySummary();
        }
        setActionLoading(false);
    };

    const handleEndShift = async () => {
        if (!activeShift) return;
        setActionLoading(true);
        const res = await endShift(activeShift.id);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Shift selesai! Makasih udah jaga bro 💪");
            await fetchShiftData();
            await fetchWeeklySummary();
        }
        setActionLoading(false);
    };

    const handleTakeover = async () => {
        if (!selectedUserId || !activeShift) return toast.error("Pilih dulu siapa yang mau lanjutin!");
        if (selectedUserId === activeShift.user_id) return toast.error("Gak bisa takeover diri sendiri dong bro!");
        setActionLoading(true);
        const res = await takeoverShift(activeShift.id, selectedUserId);
        if (res.error) {
            toast.error(res.error);
        } else {
            const oldUser = activeShift.admin_profiles?.username || "???";
            const newUser = shiftUsers.find((u) => u.id === selectedUserId)?.username || "???";
            toast.success(`${newUser} lanjutin shift-nya ${oldUser}! Semangat! 🚀`);
            setTakeoverDialogOpen(false);
            setSelectedUserId("");
            await fetchShiftData();
            await fetchWeeklySummary();
        }
        setActionLoading(false);
    };

    const statCards = [
        {
            label: "Total Game",
            value: stats.games,
            icon: Gamepad2,
            color: "text-primary",
            neon: "neon-text-primary",
        },
        {
            label: "Total Master Akun",
            value: stats.accounts,
            icon: Users,
            color: "text-accent",
            neon: "neon-text-accent",
        },
        {
            label: "Total Item Terdaftar",
            value: stats.items,
            icon: Package,
            color: "text-blue-400",
            neon: "",
            style: { textShadow: "0 0 10px rgba(96,165,250,0.5)" },
        },
    ];

    const currentGuardUsername = activeShift?.admin_profiles?.username || null;

    return (
        <div className="text-foreground min-h-screen bg-black p-8 pb-20">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-md md:flex-row">
                    <div className="absolute inset-0 z-0 bg-[url('/cyberpunk_hero.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>

                    <div className="relative z-10 flex-1">
                        <h1 className="neon-text-primary text-4xl font-bold tracking-widest uppercase">Dashboard</h1>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">Ringkasan markas besar Traxstore saat ini. Pantau semua statistik akun, game, dan item yang terdaftar secara real-time.</p>
                    </div>

                    <div className="relative z-10 hidden h-56 w-56 shrink-0 md:block">
                        <Image src="/cyberpunk_character.jpg" alt="Cyberpunk Hacker" width={224} height={224} className="h-full w-full object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]" />
                    </div>
                </div>

                {/* ===== WEEKLY SUMMARY (SABTU-JUMAT) ===== */}
                <div className="mt-8">
                    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/30">
                                <Calendar className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold tracking-widest text-purple-400 uppercase" style={{ textShadow: "0 0 8px rgba(168,85,247,0.4)" }}>
                                    Laporan Gaji Mingguan (Sabtu - Jumat)
                                </h3>
                                <p className="text-xs text-zinc-600">
                                    {weeklyPeriodStart && new Date(weeklyPeriodStart).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} — {weeklyPeriodEnd && new Date(weeklyPeriodEnd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-950 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white" onClick={() => setWeekOffset((o) => o - 1)}>
                                <ChevronLeft className="mr-1 h-3 w-3" /> Minggu Lalu
                            </Button>
                            {weekOffset < 0 && (
                                <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-950 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white" onClick={() => setWeekOffset((o) => o + 1)}>
                                    Minggu Depan <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            )}
                            {weekOffset !== 0 && (
                                <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:bg-purple-500/10 hover:text-purple-300" onClick={() => setWeekOffset(0)}>
                                    Minggu Ini
                                </Button>
                            )}
                        </div>
                    </div>

                    {weeklyLoading ? (
                        <div className="grid gap-3 md:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />
                            ))}
                        </div>
                    ) : weeklySummary.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-6 text-center text-sm text-zinc-500">Belum ada jam jaga buat minggu ini. Kuy nge-shift!</div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {weeklySummary.map((s) => (
                                <Card key={s.user_id} className="border-zinc-800 bg-zinc-950/80">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/50 ring-2 ring-zinc-700">
                                            <span className="text-base font-black text-zinc-300">{s.username?.charAt(0)?.toUpperCase() || "?"}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">{s.username}</p>
                                            <p className="text-xs text-zinc-500">{s.shift_count} shift</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-lg font-bold text-purple-400" style={{ textShadow: "0 0 8px rgba(168,85,247,0.3)" }}>
                                                {Math.floor(s.total_minutes / 60)}j {Math.round(s.total_minutes % 60)}m
                                            </p>
                                            <p className="text-[10px] text-zinc-600">{formatDurationMinutes(s.total_minutes)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8"></div>

                <div className="grid gap-6 md:grid-cols-3">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.label} className="border-zinc-800 bg-zinc-950">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-bold tracking-widest text-zinc-400 uppercase">{card.label}</CardTitle>
                                    <Icon className={`h-6 w-6 ${card.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-5xl font-bold text-white ${card.neon} mt-4`} style={card.style || {}}>
                                        {loading ? <Skeleton className="h-12 w-24 bg-zinc-800" /> : card.value}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ===== SHIFT / JAGA TOKO SECTION ===== */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5"></div>
                    <div className="relative z-10">
                        <div className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/30">
                                    <Clock className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-wide text-white uppercase" style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)" }}>
                                        Penjaga Toko
                                    </h2>
                                    <p className="text-xs text-zinc-500">Siapa yang lagi nongkrong jaga markas?</p>
                                </div>
                            </div>
                            <Link href="/shifts" className="text-xs font-bold text-green-400 transition-colors hover:text-green-300 hover:underline">
                                Lihat History & Laporan →
                            </Link>
                        </div>

                        {shiftLoading ? (
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-8 md:flex-row">
                                <Skeleton className="h-16 w-16 rounded-full bg-zinc-800" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-40 bg-zinc-800" />
                                    <Skeleton className="h-4 w-24 bg-zinc-800" />
                                </div>
                            </div>
                        ) : activeShift ? (
                            /* === ADA YANG JAGA === */
                            <div className="flex flex-col gap-4 rounded-xl border border-green-500/20 bg-zinc-950/60 p-5 md:flex-row md:items-center">
                                <div className="flex flex-1 items-center gap-4">
                                    <div className="relative">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/40">
                                            <span className="text-xl font-black text-green-400">{currentGuardUsername?.charAt(0)?.toUpperCase() || "?"}</span>
                                        </div>
                                        <span className="absolute -right-0.5 -bottom-0.5 h-4 w-4 animate-pulse rounded-full border-2 border-zinc-950 bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white">{currentGuardUsername || "Unknown"}</p>
                                        <p className="text-xs text-zinc-500">
                                            Mulai jaga sejak{" "}
                                            {new Date(activeShift.started_at).toLocaleTimeString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-black/50 px-4 py-2">
                                        <Timer className="h-4 w-4 text-green-400" />
                                        <span className="font-mono text-xl font-bold text-green-400" style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)" }}>
                                            {liveDuration}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {activeShift.user_id === session?.user?.id && (
                                        <ConfirmDialog
                                            trigger={
                                                <Button variant="ghost" className="gap-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300" disabled={actionLoading}>
                                                    <Square className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Akhiri</span>
                                                </Button>
                                            }
                                            title="Yakin mau akhiri shift ini?"
                                            description={
                                                <>
                                                    Shift-nya <strong>{currentGuardUsername}</strong> bakal ditandai selesai. Durasi total: <strong className="text-green-400">{liveDuration}</strong>
                                                </>
                                            }
                                            onConfirm={handleEndShift}
                                            confirmText="Ya, Akhiri Shift"
                                            confirmClassName="bg-red-600 hover:bg-red-700 text-white font-bold"
                                        />
                                    )}
                                    {activeShift.user_id !== session?.user?.id && (
                                        <Button
                                            variant="ghost"
                                            className="gap-2 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
                                            onClick={() => {
                                                setSelectedUserId("");
                                                setTakeoverDialogOpen(true);
                                            }}
                                            disabled={actionLoading}
                                        >
                                            <ArrowRightLeft className="h-4 w-4" />
                                            <span className="hidden sm:inline">Takeover</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* === GAK ADA YANG JAGA === */
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-8 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-zinc-700">
                                    <Clock className="h-8 w-8 text-zinc-600" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-zinc-400">Belum ada yang jaga nih...</p>
                                    <p className="mt-1 text-xs text-zinc-600">Toko masih kosong. Ada yang mau volunteer? 👀</p>
                                </div>
                                <Button
                                    className="mt-2 gap-2 bg-green-600 font-bold text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                                    onClick={() => {
                                        setSelectedUserId(session?.user?.id || "");
                                        setStartDialogOpen(true);
                                    }}
                                    disabled={actionLoading}
                                >
                                    <Play className="h-4 w-4" />
                                    Mulai Jaga Sekarang
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Start Shift Dialog */}
                <FormDialog open={startDialogOpen} onOpenChange={setStartDialogOpen} title="Mulai Shift Jaga 🏪" titleClassName="text-xl font-bold text-green-400" maxWidth="sm:max-w-md">
                    <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Siapa yang mau jaga?</Label>
                            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:ring-1 focus:ring-green-500/50">
                                <option value="">— Pilih user —</option>
                                {shiftUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.username} {u.id === session?.user?.id ? "(You)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button onClick={handleStartShift} disabled={actionLoading || !selectedUserId} className="h-12 w-full gap-2 bg-green-600 font-bold text-white hover:bg-green-500">
                            <Play className="h-4 w-4" />
                            {actionLoading ? "Memulai..." : "Gas Mulai Jaga!"}
                        </Button>
                    </div>
                </FormDialog>

                {/* Takeover Dialog */}
                <FormDialog open={takeoverDialogOpen} onOpenChange={setTakeoverDialogOpen} title="Takeover Shift ⚡" titleClassName="text-xl font-bold text-yellow-400" maxWidth="sm:max-w-md">
                    <div className="mt-4 space-y-4">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                            <p className="text-xs text-zinc-500">
                                Shift-nya <strong className="text-white">{currentGuardUsername}</strong> bakal diakhiri dan dilanjutin sama orang yang lu pilih di bawah. Jam si {currentGuardUsername} berhenti, jam pengganti mulai jalan.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Siapa yang mau lanjutin?</Label>
                            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500/50">
                                <option value="">— Pilih pengganti —</option>
                                {shiftUsers
                                    .filter((u) => u.id !== activeShift?.user_id)
                                    .map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.username} {u.id === session?.user?.id ? "(You)" : ""}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <Button onClick={handleTakeover} disabled={actionLoading || !selectedUserId} className="h-12 w-full gap-2 bg-yellow-600 font-bold text-black hover:bg-yellow-500">
                            <ArrowRightLeft className="h-4 w-4" />
                            {actionLoading ? "Proses takeover..." : "Takeover Sekarang!"}
                        </Button>
                    </div>
                </FormDialog>

                <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm md:flex-row">
                    <div className="h-40 w-40 shrink-0">
                        <Image src="/cyberpunk_loot.jpg" alt="Cyberpunk Loot Box" width={160} height={160} className="h-full w-full object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
                    </div>
                    <div>
                        <h2 className="neon-text-accent text-xl font-bold tracking-widest text-white uppercase">Manajemen Item & Loot</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">Sistem inventaris dan item telah terhubung dengan database Traxstore. Sinkronisasi data real-time membantu melacak aset secara presisi.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
