import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { formatWibDate } from "@/lib/wib";

/**
 * Rekap jam per admin untuk satu minggu (Sabtu–Jumat WIB). SERVER COMPONENT.
 *
 * Navigasi minggu pindah dari useState ke URL (?week=-1). Tiga alasan:
 *   - Datanya bisa diambil di server, jadi gak ada layar skeleton tiap klik.
 *   - "Rekap minggu lalu" jadi link yang bisa dikirim ke orang.
 *   - Tombol back browser jalan.
 *
 * Tombolnya <Link>, jadi Next bisa prefetch dan klik-nya kerasa instan.
 */
function hrefForWeek(basePath, searchParams, weekOffset) {
    const params = new URLSearchParams(searchParams);
    if (weekOffset === 0) params.delete("week");
    else params.set("week", String(weekOffset));

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
}

export function WeeklyShiftSummary({ summary, periodStart, periodEnd, weekOffset, basePath, searchParams, error }) {
    return (
        <section>
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 ring-primary/30 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
                        <Calendar className="text-primary h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">Total jam · Sabtu–Jumat</p>
                        <p className="text-foreground text-sm font-semibold">
                            {formatWibDate(periodStart)} — {formatWibDate(periodEnd)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link href={hrefForWeek(basePath, searchParams, weekOffset - 1)} scroll={false}>
                        <span className="border-border bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground inline-flex h-8 items-center rounded-lg border px-2.5 text-xs transition-colors">
                            <ChevronLeft className="mr-1 h-3 w-3" /> Minggu lalu
                        </span>
                    </Link>

                    {weekOffset < 0 && (
                        <Link href={hrefForWeek(basePath, searchParams, weekOffset + 1)} scroll={false}>
                            <span className="border-border bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground inline-flex h-8 items-center rounded-lg border px-2.5 text-xs transition-colors">
                                Minggu depan <ChevronRight className="ml-1 h-3 w-3" />
                            </span>
                        </Link>
                    )}

                    {weekOffset !== 0 && (
                        <Link href={hrefForWeek(basePath, searchParams, 0)} scroll={false}>
                            <span className="text-primary hover:bg-primary/10 inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold transition-colors">Minggu ini</span>
                        </Link>
                    )}
                </div>
            </div>

            {error ? (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-xl border p-4 text-sm" role="alert">
                    Gagal ngitung rekap: {error}
                </div>
            ) : summary.length === 0 ? (
                <div className="border-border bg-surface-1/40 rounded-xl border border-dashed p-6 text-center">
                    <p className="text-foreground text-sm font-medium">{weekOffset === 0 ? "Belum ada jam kecatat minggu ini" : "Minggu itu gak ada shift kecatat"}</p>
                    <p className="text-muted-foreground mt-1 text-xs">Angkanya nongol begitu ada shift yang diakhirin.</p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {summary.map((row) => {
                        const hours = Math.floor(row.total_minutes / 60);
                        const minutes = Math.round(row.total_minutes % 60);

                        return (
                            <Card key={row.user_id} className="glass-subtle">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="bg-surface-3/50 ring-border flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2">
                                        <span className="text-foreground/85 text-sm font-bold">{getInitials(row.username)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-sm font-semibold">{row.username}</p>
                                        {/* Jumlah shift ditambahin: 20 jam dari 2 shift beda banget
                                            artinya sama 20 jam dari 14 shift. */}
                                        <p className="text-muted-foreground text-xs">
                                            {row.shift_count} shift{minutes > 0 ? ` · ${minutes} menit` : ""}
                                        </p>
                                    </div>
                                    <p className="text-primary shrink-0 font-mono text-lg font-bold">{hours}j</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
