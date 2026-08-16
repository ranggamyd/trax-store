"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { GlobalLoading } from "@/components/GlobalLoading";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { DataTable } from "@/components/organisms/DataTable";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, Play, Square, ArrowRightLeft, Timer, Calendar, Link2, ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveShift, getShiftUsers, startShift, endShift, takeoverShift, getShiftHistory, getWeeklyShiftSummary } from "@/app/actions/shifts";

function formatDuration(startedAt, endedAt) {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diff = Math.max(0, end - start);
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

function getDefaultDateRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysSinceSaturday = (dayOfWeek + 1) % 7;

    const startBoundary = new Date(now);
    startBoundary.setDate(now.getDate() - daysSinceSaturday);

    const endBoundary = new Date(startBoundary);
    endBoundary.setDate(startBoundary.getDate() + 6);

    const format = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    return {
        startDate: format(startBoundary),
        endDate: format(endBoundary),
    };
}

export default function ShiftsPage() {
    // Auth
    const [isReady, setIsReady] = useState(false);

    // Active shift state
    const [activeShift, setActiveShift] = useState(null);
    const [shiftUsers, setShiftUsers] = useState([]);
    const [liveDuration, setLiveDuration] = useState("00:00:00");
    const [shiftLoading, setShiftLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");

    // History state
    const [history, setHistory] = useState([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyPage, setHistoryPage] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [filterUserId, setFilterUserId] = useState("");
    const [filterStartDate, setFilterStartDate] = useState(getDefaultDateRange().startDate);
    const [filterEndDate, setFilterEndDate] = useState(getDefaultDateRange().endDate);

    // Weekly Summary State
    const [weeklySummary, setWeeklySummary] = useState([]);
    const [weeklyPeriodStart, setWeeklyPeriodStart] = useState("");
    const [weeklyPeriodEnd, setWeeklyPeriodEnd] = useState("");
    const [weekOffset, setWeekOffset] = useState(0);
    const [weeklyLoading, setWeeklyLoading] = useState(true);

    const PAGE_SIZE = 15;

    const { session } = useAuthGuard(() => {
        setIsReady(true);
    });

    const fetchShiftData = useCallback(async () => {
        setShiftLoading(true);
        const [shiftRes, usersRes] = await Promise.all([getActiveShift(), getShiftUsers()]);
        setActiveShift(shiftRes.shift || null);
        if (usersRes.users) setShiftUsers(usersRes.users);
        setShiftLoading(false);
    }, []);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        const res = await getShiftHistory({
            startDate: filterStartDate,
            endDate: filterEndDate,
            userId: filterUserId || undefined,
            page: historyPage,
            pageSize: PAGE_SIZE,
        });
        if (res.error) {
            toast.error(res.error);
        } else {
            setHistory(res.shifts || []);
            setHistoryTotal(res.total || 0);
        }
        setHistoryLoading(false);
    }, [filterStartDate, filterEndDate, filterUserId, historyPage]);

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
        if (!isReady) return;
        const timeoutId = setTimeout(() => {
            fetchShiftData();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [isReady, fetchShiftData]);

    useEffect(() => {
        if (!isReady) return;
        const timeoutId = setTimeout(() => {
            fetchHistory();
            fetchWeeklySummary();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [isReady, fetchHistory, fetchWeeklySummary]);

    // Live timer
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

    // Handlers
    const handleStartShift = async () => {
        if (!selectedUserId) return toast.error("Pilih dulu siapa yang mau jaga!");
        setActionLoading(true);
        const res = await startShift(selectedUserId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Shift dimulai! Let's go! 🔥");
            setStartDialogOpen(false);
            setSelectedUserId("");
            await fetchShiftData();
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
            toast.success("Shift selesai! GG bro 💪");
            await Promise.all([fetchShiftData(), fetchHistory(), fetchWeeklySummary()]);
        }
        setActionLoading(false);
    };

    const handleTakeover = async () => {
        if (!selectedUserId || !activeShift) return toast.error("Pilih dulu penggantinya!");
        if (selectedUserId === activeShift.user_id) return toast.error("Gabisa takeover diri sendiri lah bro!");
        setActionLoading(true);
        const res = await takeoverShift(activeShift.id, selectedUserId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Takeover berhasil! Shift baru jalan 🚀");
            setTakeoverDialogOpen(false);
            setSelectedUserId("");
            await Promise.all([fetchShiftData(), fetchHistory(), fetchWeeklySummary()]);
        }
        setActionLoading(false);
    };

    const totalPages = Math.ceil(historyTotal / PAGE_SIZE);
    const currentGuardUsername = activeShift?.admin_profiles?.username || null;

    if (!session) return <GlobalLoading text="Mengecek sesi..." />;

    return (
        <PageContainer>
            <PageHeader title="Jadwal Jaga Toko" subtitle="Atur shift, pantau siapa yang lagi on duty, dan cek laporan jam kerja." icon={Clock} color="primary" />

            {/* ===== ACTIVE SHIFT SECTION ===== */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5"></div>
                <div className="relative z-10">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/30">
                            <Clock className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold tracking-widest text-green-400 uppercase" style={{ textShadow: "0 0 8px rgba(34,197,94,0.4)" }}>
                                Shift Aktif Sekarang
                            </h3>
                            <p className="text-xs text-zinc-600">Real-time guard status</p>
                        </div>
                    </div>

                    {shiftLoading ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-8 md:flex-row">
                            <Skeleton className="h-14 w-14 rounded-full bg-zinc-800" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-40 bg-zinc-800" />
                                <Skeleton className="h-4 w-24 bg-zinc-800" />
                            </div>
                            <Skeleton className="h-10 w-32 bg-zinc-800" />
                        </div>
                    ) : activeShift ? (
                        <div className="flex flex-col gap-4 rounded-xl border border-green-500/20 bg-zinc-950/60 p-5 md:flex-row md:items-center">
                            <div className="flex flex-1 items-center gap-4">
                                <div className="relative">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/40">
                                        <span className="text-xl font-black text-green-400">{currentGuardUsername?.charAt(0)?.toUpperCase() || "?"}</span>
                                    </div>
                                    <span className="absolute -right-0.5 -bottom-0.5 h-4 w-4 animate-pulse rounded-full border-2 border-zinc-950 bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">{currentGuardUsername}</p>
                                    <p className="text-xs text-zinc-500">
                                        On duty sejak{" "}
                                        {new Date(activeShift.started_at).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                        {activeShift.takeover_from && (
                                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                                                <Link2 className="h-2.5 w-2.5" /> Takeover
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-black/50 px-4 py-2.5">
                                <Timer className="h-4 w-4 text-green-400" />
                                <span className="font-mono text-xl font-bold text-green-400" style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)" }}>
                                    {liveDuration}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                {activeShift.user_id === session?.user?.id && (
                                    <ConfirmDialog
                                        trigger={
                                            <Button variant="ghost" className="gap-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300" disabled={actionLoading}>
                                                <Square className="h-4 w-4" />
                                                Akhiri
                                            </Button>
                                        }
                                        title="Yakin mau akhiri shift ini?"
                                        description={
                                            <>
                                                Shift-nya <strong>{currentGuardUsername}</strong> bakal ditandai selesai. Durasi: <strong className="text-green-400">{liveDuration}</strong>
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
                                        Takeover
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-8 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-zinc-700">
                                <Clock className="h-8 w-8 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-zinc-400">Toko lagi kosong bro...</p>
                                <p className="mt-1 text-xs text-zinc-600">Belum ada yang jaga. Siapa yang mau standby? 👀</p>
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

            <div className="my-8 h-px bg-zinc-800/50" />

            {/* ===== FILTER BAR ===== */}
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-zinc-500">Dari Tanggal</Label>
                    <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => {
                            setFilterStartDate(e.target.value);
                            setHistoryPage(0);
                        }}
                        className="border-zinc-800 bg-zinc-900 text-white"
                    />
                </div>
                <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-zinc-500">Sampai Tanggal</Label>
                    <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => {
                            setFilterEndDate(e.target.value);
                            setHistoryPage(0);
                        }}
                        className="border-zinc-800 bg-zinc-900 text-white"
                    />
                </div>
                <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-zinc-500">Filter User</Label>
                    <select
                        value={filterUserId}
                        onChange={(e) => {
                            setFilterUserId(e.target.value);
                            setHistoryPage(0);
                        }}
                        className="focus:ring-primary/50 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:ring-1"
                    >
                        <option value="">Semua User</option>
                        {shiftUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.username}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ===== HISTORY TABLE ===== */}
            <div>
                <div className="mb-4 flex items-center gap-3">
                    <div className="bg-primary/10 ring-primary/30 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
                        <Calendar className="text-primary h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-primary neon-text-primary text-sm font-bold tracking-widest uppercase">History Jaga Toko</h3>
                        <p className="text-xs text-zinc-600">Rekap lengkap buat laporan gajian 💰</p>
                    </div>
                </div>

                <DataTable
                    loading={historyLoading}
                    data={history}
                    emptyMessage="Belum ada history shift di periode ini."
                    columns={[{ label: "Penjaga" }, { label: "Tanggal" }, { label: "Mulai" }, { label: "Selesai" }, { label: "Durasi" }, { label: "Status", className: "text-center" }]}
                    renderRow={(shift) => {
                        const username = shift.admin_profiles?.username || "Unknown";
                        const startTime = new Date(shift.started_at);
                        const endTime = new Date(shift.ended_at);
                        const duration = formatDuration(shift.started_at, shift.ended_at);
                        const isTakeover = shift.ended_by === "takeover";
                        const wasTakenOver = shift.takeover_from;

                        return (
                            <TableRow key={shift.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableCell className="font-medium text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">{username.charAt(0).toUpperCase()}</div>
                                        {username}
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-400">
                                    {startTime.toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-zinc-300">{startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                                <TableCell className="font-mono text-sm text-zinc-300">{endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm font-bold text-green-400">{duration}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    {isTakeover ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-[10px] font-bold tracking-wider text-yellow-400 uppercase ring-1 ring-yellow-500/20">
                                            <ArrowRightLeft className="h-3 w-3" /> Di-takeover
                                        </span>
                                    ) : wasTakenOver ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-400 uppercase ring-1 ring-blue-500/20">
                                            <Link2 className="h-3 w-3" /> Lanjutan
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-bold tracking-wider text-green-400 uppercase ring-1 ring-green-500/20">✓ Normal</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-zinc-500">
                            Menampilkan {historyPage * PAGE_SIZE + 1}–{Math.min((historyPage + 1) * PAGE_SIZE, historyTotal)} dari {historyTotal} shift
                        </p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white" onClick={() => setHistoryPage((p) => Math.max(0, p - 1))} disabled={historyPage === 0}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="flex items-center px-3 text-xs font-bold text-zinc-400">
                                {historyPage + 1} / {totalPages}
                            </span>
                            <Button variant="ghost" size="sm" className="border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white" onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))} disabled={historyPage >= totalPages - 1}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== DIALOGS ===== */}
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

            <FormDialog open={takeoverDialogOpen} onOpenChange={setTakeoverDialogOpen} title="Takeover Shift ⚡" titleClassName="text-xl font-bold text-yellow-400" maxWidth="sm:max-w-md">
                <div className="mt-4 space-y-4">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                        <p className="text-xs text-zinc-500">
                            Shift-nya <strong className="text-white">{currentGuardUsername}</strong> bakal diakhiri dan dilanjutin sama orang yang lu pilih. Jam si {currentGuardUsername} berhenti, jam pengganti mulai jalan.
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
        </PageContainer>
    );
}
