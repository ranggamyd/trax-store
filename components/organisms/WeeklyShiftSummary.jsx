import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getWeeklyShiftSummary } from "@/app/actions/shifts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export function WeeklyShiftSummary({ refreshTrigger }) {
    const { session } = useAuthGuard();
    const [weeklySummary, setWeeklySummary] = useState([]);
    const [weeklyPeriodStart, setWeeklyPeriodStart] = useState("");
    const [weeklyPeriodEnd, setWeeklyPeriodEnd] = useState("");
    const [weekOffset, setWeekOffset] = useState(0);
    const [weeklyLoading, setWeeklyLoading] = useState(true);

    const fetchWeeklySummary = useCallback(async () => {
        setWeeklyLoading(true);
        const res = await getWeeklyShiftSummary({ weekOffset });
        setWeeklySummary(res.summary || []);
        setWeeklyPeriodStart(res.periodStart);
        setWeeklyPeriodEnd(res.periodEnd);
        setWeeklyLoading(false);
    }, [weekOffset]);

    useEffect(() => {
        if (!session) return;
        const timeoutId = setTimeout(() => {
            fetchWeeklySummary();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [fetchWeeklySummary, session, refreshTrigger]);

    return (
        <div className="mt-8">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/30">
                        <Calendar className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-widest text-purple-400 uppercase" style={{ textShadow: "0 0 8px rgba(168,85,247,0.4)" }}>
                            Total jam (Sabtu - Jumat)
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
                <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-6 text-center text-sm text-zinc-500">Kosong</div>
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
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-lg font-bold text-purple-400" style={{ textShadow: "0 0 8px rgba(168,85,247,0.3)" }}>
                                        {Math.floor(s.total_minutes / 60)}jam
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
