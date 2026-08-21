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
                    <div className="bg-primary/10 ring-primary/30 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
                        <Calendar className="text-primary h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-primary text-sm font-bold tracking-widest uppercase">Total jam (Sabtu - Jumat)</h3>
                        <p className="text-muted-foreground/70 text-xs">
                            {weeklyPeriodStart && new Date(weeklyPeriodStart).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} — {weeklyPeriodEnd && new Date(weeklyPeriodEnd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button variant="outline" size="sm" className="border-border bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground text-xs" onClick={() => setWeekOffset((o) => o - 1)}>
                        <ChevronLeft className="mr-1 h-3 w-3" /> Minggu Lalu
                    </Button>
                    {weekOffset < 0 && (
                        <Button variant="outline" size="sm" className="border-border bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground text-xs" onClick={() => setWeekOffset((o) => o + 1)}>
                            Minggu Depan <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                    )}
                    {weekOffset !== 0 && (
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary text-xs" onClick={() => setWeekOffset(0)}>
                            Minggu Ini
                        </Button>
                    )}
                </div>
            </div>

            {weeklyLoading ? (
                <div className="grid gap-3 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="bg-surface-3 h-24 rounded-xl" />
                    ))}
                </div>
            ) : weeklySummary.length === 0 ? (
                <div className="border-border bg-surface-1/40 rounded-xl border border-dashed p-6 text-center">
                    <p className="text-foreground text-sm font-medium">Belum ada jam kecatat minggu ini</p>
                    <p className="text-muted-foreground mt-1 text-xs">Angkanya nongol begitu ada shift yang diakhirin.</p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {weeklySummary.map((s) => (
                        <Card key={s.user_id} className="border-border bg-surface-1/80">
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="bg-surface-3/50 ring-border flex h-11 w-11 items-center justify-center rounded-full ring-2">
                                    <span className="text-foreground/85 text-base font-black">{s.username?.charAt(0)?.toUpperCase() || "?"}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-foreground text-sm font-bold">{s.username}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-primary font-mono text-lg font-bold">{Math.floor(s.total_minutes / 60)}jam</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
