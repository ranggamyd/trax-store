import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { AnimatedTooltip } from "@/components/aceternity/AnimatedTooltip";
import { CardSpotlight } from "@/components/aceternity/CardSpotlight";
import { NumberTicker } from "@/components/aceternity/NumberTicker";
import { getInitials } from "@/lib/utils";
import { formatWibDate } from "@/lib/wib";

/**
 * Rekap jam per admin untuk satu minggu (Sabtu–Jumat WIB). SERVER COMPONENT.
 *
 * Navigasi minggu pindah dari useState ke URL (?week=-1), jadi rekap minggu lalu
 * bisa dikirim sebagai link dan tombol back jalan.
 *
 * Dua komponen Aceternity dipakai di sini:
 *   - AnimatedTooltip : deretan avatar di header. Sekali lihat lu tau siapa aja
 *                       yang jaga minggu itu, tanpa baca satu-satu kartunya.
 *   - NumberTicker    : jamnya naik dari nol. Bikin angkanya kerasa dihitung.
 *
 * Isi kartunya tetep dirender SERVER — CardSpotlight cuma pembungkus tipis yang
 * jadi client component. Anak-anaknya gak ikut kebawa ke bundle browser.
 */
function hrefForWeek(basePath, searchParams, weekOffset) {
    const params = new URLSearchParams(searchParams);
    if (weekOffset === 0) params.delete("week");
    else params.set("week", String(weekOffset));

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
}

export function WeeklyShiftSummary({ summary, periodStart, periodEnd, weekOffset, basePath, searchParams, error }) {
    const totalHours = Math.round(summary.reduce((total, row) => total + row.total_minutes, 0) / 60);

    const avatars = summary.slice(0, 6).map((row) => ({
        id: row.user_id,
        name: row.username,
        initials: getInitials(row.username),
        detail: `${Math.floor(row.total_minutes / 60)} jam · ${row.shift_count} shift`,
    }));

    return (
        <section>
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 ring-primary/30 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
                        <Calendar className="text-primary h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">Jam jaga · Sabtu–Jumat</p>
                        <p className="text-foreground text-sm font-semibold">
                            {formatWibDate(periodStart)} — {formatWibDate(periodEnd)}
                            {totalHours > 0 && <span className="text-muted-foreground font-normal"> · {totalHours} jam total</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {avatars.length > 0 && <AnimatedTooltip items={avatars} className="mr-1" />}

                    <div className="flex items-center gap-1.5">
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
            </div>

            {error ? (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-xl border p-4 text-sm" role="alert">
                    Rekap jamnya gagal dihitung: {error}. Coba refresh — kalau masih gagal, kabarin developer.
                </div>
            ) : summary.length === 0 ? (
                <div className="border-border bg-surface-1/40 rounded-xl border border-dashed p-6 text-center">
                    <p className="text-foreground text-sm font-medium">{weekOffset === 0 ? "Minggu ini belum ada jam kecatat" : "Minggu itu gak ada shift kecatat"}</p>
                    <p className="text-muted-foreground mt-1 text-xs">Angkanya nongol begitu ada shift yang diakhirin — shift yang masih jalan belum kehitung.</p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {summary.map((row) => {
                        const hours = Math.floor(row.total_minutes / 60);
                        const minutes = Math.round(row.total_minutes % 60);

                        return (
                            <CardSpotlight key={row.user_id} className="p-4" radius={220}>
                                <div className="flex items-center gap-4">
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
                                    <p className="text-primary shrink-0 font-mono text-lg font-bold">
                                        <NumberTicker value={hours} suffix="j" />
                                    </p>
                                </div>
                            </CardSpotlight>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
