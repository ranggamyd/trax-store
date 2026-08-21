import { EmptyRadar } from "@/components/illustrations/EmptyRadar";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Tabel data.
 *
 * Perubahan utama: EMPTY STATE-nya sekarang beneran.
 *
 * Yang lama nampilin satu string abu-abu di tengah sel — biasanya "Kosong"
 * atau "Data nggak ketemu bro." Itu jalan buntu: user dikasih tau ada yang
 * gak ada, tapi gak dikasih tau harus ngapain. Empty state itu justru layar
 * yang paling sering dilihat user BARU, dan real estate paling mahal di app.
 *
 * Sekarang tiga lapis: ilustrasi (bilang "udah dicari") + judul + petunjuk
 * langkah berikutnya, plus slot CTA opsional.
 *
 * `footer` buat naro Pagination di dalem kartu yang sama, bukan ngambang di
 * bawahnya — pager yang kepisah dari tabelnya gampang kelewat.
 *
 * `emptyMessage` masih diterima biar halaman lama gak pecah, tapi dia dipakai
 * sebagai JUDUL — bukan lagi satu-satunya teks.
 */
export function DataTable({ columns, data, loading = false, emptyMessage, emptyTitle, emptyHint, emptyAction, emptyIllustration, renderRow, footer, className }) {
    if (loading && (!data || data.length === 0)) {
        return <TableSkeleton rows={5} columns={columns.length} />;
    }

    const isEmpty = !data || data.length === 0;

    return (
        <div className={cn("glass-subtle overflow-hidden rounded-2xl", className)}>
            <div className="custom-scrollbar w-full overflow-x-auto">
                <Table>
                    <TableHeader className="bg-surface-2/80 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow className="border-border hover:bg-transparent">
                            {columns.map((col, idx) => (
                                <TableHead key={idx} className={cn("text-muted-foreground h-11 text-[11px] font-bold tracking-[0.12em] whitespace-nowrap uppercase", col.className)}>
                                    {col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isEmpty ? (
                            <TableRow className="border-transparent hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-0">
                                    <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center">
                                        {emptyIllustration ?? <EmptyRadar className="mb-2 h-32 w-32 opacity-90" />}
                                        <p className="text-foreground text-base font-semibold">{emptyTitle || emptyMessage || "Belum ada apa-apa di sini"}</p>
                                        <p className="text-muted-foreground max-w-sm text-sm">{emptyHint || "Coba longgarin filter pencariannya, atau tambah data pertama lu."}</p>
                                        {emptyAction && <div className="mt-4">{emptyAction}</div>}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => renderRow(item, index))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isEmpty && footer}
        </div>
    );
}
