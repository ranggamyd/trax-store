import { ArrowRightLeft, Clock, Play, Square, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { endShift, getActiveShift, startShift, takeoverShift } from "@/app/actions/shifts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { formatDuration } from "@/lib/utils";

export function ShiftOverview({ onShiftEnded, onShiftChange }) {
    const pathname = usePathname();
    const [activeShift, setActiveShift] = useState(null);
    const [liveDuration, setLiveDuration] = useState("00:00:00");
    const [shiftLoading, setShiftLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchShiftData = useCallback(async () => {
        setShiftLoading(true);
        const shiftRes = await getActiveShift();
        if (shiftRes.shift) setActiveShift(shiftRes.shift);
        else setActiveShift(null);
        setShiftLoading(false);
    }, []);

    const { session } = useAuthGuard(() => {
        fetchShiftData();
    });

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

    const handleStartShift = async () => {
        const userIdToStart = session?.user?.id;
        setActionLoading(true);
        await startShift(userIdToStart);
        await fetchShiftData();
        if (onShiftChange) onShiftChange();
        setActionLoading(false);
    };

    const handleEndShift = async () => {
        if (!activeShift) return;
        setActionLoading(true);
        await endShift(activeShift.id);
        await fetchShiftData();
        if (onShiftEnded) onShiftEnded();
        if (onShiftChange) onShiftChange();
        setActionLoading(false);
    };

    const handleTakeover = async () => {
        const userIdToTakeover = session?.user?.id;

        setActionLoading(true);
        await takeoverShift(activeShift.id, userIdToTakeover);
        await fetchShiftData();
        if (onShiftChange) onShiftChange();
        setActionLoading(false);
    };

    const currentGuardUsername = activeShift?.admin_profiles?.username || null;

    return (
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
                                Yang lagi jaga
                            </h2>
                        </div>
                    </div>
                    {pathname !== "/shifts" && (
                        <Link href="/shifts" className="text-xs font-bold text-green-400 transition-colors hover:text-green-300 hover:underline">
                            History
                        </Link>
                    )}
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
                                    Dari jam:{" "}
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
                                <Button variant="ghost" className="gap-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={handleEndShift} disabled={actionLoading}>
                                    <Square className="h-4 w-4" />
                                    <span className="hidden sm:inline">Lepas</span>
                                </Button>
                            )}
                            {activeShift.user_id !== session?.user?.id && (
                                <Button variant="ghost" className="gap-2 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300" onClick={handleTakeover} disabled={actionLoading}>
                                    <ArrowRightLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Takeover</span>
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
                            <p className="text-base font-bold text-zinc-400">Kosong</p>
                        </div>
                        <Button size="lg" className="mt-2 gap-2 bg-green-600 font-bold text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]" onClick={handleStartShift} disabled={actionLoading}>
                            <Play className="h-4 w-4" />
                            Take sekarang
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
