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
        <div className="border-border bg-surface-2/40 relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm">
            <div className="from-success/5 to-success/5 absolute inset-0 z-0 bg-gradient-to-br via-transparent"></div>
            <div className="relative z-10">
                <div className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-success/10 ring-success/30 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
                            <Clock className="text-success h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-foreground text-lg font-bold tracking-wide uppercase">Yang lagi jaga</h2>
                        </div>
                    </div>
                    {pathname !== "/shifts" && (
                        <Link href="/shifts" className="text-success hover:text-success text-xs font-bold transition-colors hover:underline">
                            History
                        </Link>
                    )}
                </div>

                {shiftLoading ? (
                    <div className="border-border bg-surface-1/60 flex flex-col items-center gap-4 rounded-xl border p-8 md:flex-row">
                        <Skeleton className="bg-surface-3 h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="bg-surface-3 h-5 w-40" />
                            <Skeleton className="bg-surface-3 h-4 w-24" />
                        </div>
                    </div>
                ) : activeShift ? (
                    <div className="border-success/20 bg-surface-1/60 flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center">
                        <div className="flex flex-1 items-center gap-4">
                            <div className="relative">
                                <div className="bg-success/10 ring-success/40 flex h-14 w-14 items-center justify-center rounded-full ring-2">
                                    <span className="text-success text-xl font-black">{currentGuardUsername?.charAt(0)?.toUpperCase() || "?"}</span>
                                </div>
                                <span className="border-border bg-success absolute -right-0.5 -bottom-0.5 h-4 w-4 animate-pulse rounded-full border-2 shadow-[0_0_8px_rgb(52_211_153_/_0.8)]"></span>
                            </div>
                            <div>
                                <p className="text-foreground text-lg font-bold">{currentGuardUsername || "Unknown"}</p>
                                <p className="text-muted-foreground text-xs">
                                    Dari jam:{" "}
                                    {new Date(activeShift.started_at).toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="border-border flex items-center gap-2 rounded-lg border bg-black/50 px-4 py-2">
                                <Timer className="text-success h-4 w-4" />
                                <span className="text-success font-mono text-xl font-bold">{liveDuration}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {activeShift.user_id === session?.user?.id && (
                                <Button variant="ghost" className="border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 hover:text-danger gap-2 border" onClick={handleEndShift} disabled={actionLoading}>
                                    <Square className="h-4 w-4" />
                                    <span className="hidden sm:inline">Lepas</span>
                                </Button>
                            )}
                            {activeShift.user_id !== session?.user?.id && (
                                <Button variant="ghost" className="border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 hover:text-warning gap-2 border" onClick={handleTakeover} disabled={actionLoading}>
                                    <ArrowRightLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Takeover</span>
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border-border bg-surface-1/40 flex flex-col items-center gap-4 rounded-xl border border-dashed p-8 text-center">
                        <div className="bg-surface-3/50 ring-border flex h-16 w-16 items-center justify-center rounded-full ring-1">
                            <Clock className="text-muted-foreground/70 h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-foreground text-base font-semibold">Belum ada yang jaga</p>
                            <p className="text-muted-foreground mt-1 text-sm">Ambil shift biar order yang masuk ada yang pegang.</p>
                        </div>
                        <Button size="lg" className="bg-success text-success-foreground hover:bg-success/90 mt-2 gap-2 font-semibold" style={{ boxShadow: "0 0 24px rgb(52 211 153 / 0.3)" }} onClick={handleStartShift} disabled={actionLoading}>
                            <Play className="h-4 w-4" />
                            Take sekarang
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
