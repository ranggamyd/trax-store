import { History } from "lucide-react";

import { Pagination } from "@/components/molecules/Pagination";
import { DataTable } from "@/components/organisms/DataTable";
import { ShiftHistoryFilters } from "@/components/organisms/shift/ShiftHistoryFilters";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDurationText, getInitials } from "@/lib/utils";
import { formatWibDate, formatWibTime, formatWibWeekday } from "@/lib/wib";

const COLUMNS = [{ label: "Admin" }, { label: "Hari & tanggal" }, { label: "Mulai" }, { label: "Selesai" }, { label: "Durasi", className: "text-right" }];

/**
 * Riwayat shift. SERVER COMPONENT.
 *
 * Yang diperbaiki selain pindah ke server:
 *
 * 1. ERROR-NYA GAK DITELEN LAGI. Versi lama punya `// toast.error(res.error)`
 *    yang di-comment out, jadi kalau query-nya gagal tabelnya cuma kelihatan
 *    kosong — persis kayak "gak ada data", padahal errornya beda total.
 *
 * 2. Jam & tanggal diformat pakai timezone WIB eksplisit. Di render server
 *    tanpa itu, jam-nya ngikutin server (UTC di Vercel) dan meleset 7 jam.
 *
 * 3. Pagination-nya pakai komponen Pagination yang sama kayak halaman lain,
 *    dan nampilin posisi ("21–40 dari 137") bukan cuma nomor halaman.
 */
export function ShiftHistoryTable({ shifts, total, page, pageCount, pageSize, admins, filters, defaults, error }) {
    return (
        <section className="space-y-4">
            <ShiftHistoryFilters admins={admins} startDate={filters.startDate} endDate={filters.endDate} adminId={filters.adminId} defaultStartDate={defaults.startDate} defaultEndDate={defaults.endDate} />

            <div className="flex items-center gap-3">
                <div className="bg-primary/10 ring-primary/30 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
                    <History className="text-primary h-4 w-4" />
                </div>
                <div>
                    <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">Riwayat</p>
                    <p className="text-foreground text-sm font-semibold">{total > 0 ? `${total} shift di periode ini` : "Rekap jam jaga"}</p>
                </div>
            </div>

            {error && (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-xl border p-4 text-sm" role="alert">
                    Gagal ngambil riwayat: {error}
                </div>
            )}

            <DataTable
                columns={COLUMNS}
                data={shifts}
                emptyTitle="Gak ada shift di periode ini"
                emptyHint="Coba lebarin rentang tanggalnya, atau pilih Semua admin."
                footer={<Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} />}
                renderRow={(shift) => (
                    <TableRow key={shift.id} className="border-border hover:bg-surface-2/60">
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-surface-3 text-foreground/85 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">{getInitials(shift.username)}</div>
                                <span className="text-foreground">{shift.username}</span>
                            </div>
                        </TableCell>
                        {/* Nama hari jadi baris utama, tanggalnya di bawah.
                            Rotasi jaga di sini jalan per hari (Sabtu–Jumat), jadi
                            "Sabtu" itu yang dicari mata pas nyusurin kolom ini —
                            tanggalnya cuma buat mastiin minggu keberapa. */}
                        <TableCell className="text-sm whitespace-nowrap">
                            <span className="text-foreground font-medium">{formatWibWeekday(shift.started_at)}</span>
                            <span className="text-muted-foreground block text-xs">{formatWibDate(shift.started_at)}</span>
                        </TableCell>
                        <TableCell className="text-foreground/85 font-mono text-sm">{formatWibTime(shift.started_at)}</TableCell>
                        <TableCell className="text-foreground/85 font-mono text-sm">{formatWibTime(shift.ended_at)}</TableCell>
                        <TableCell className="text-right">
                            <span className="text-success font-mono text-sm font-semibold">{formatDurationText(shift.started_at, shift.ended_at)}</span>
                        </TableCell>
                    </TableRow>
                )}
            />
        </section>
    );
}
