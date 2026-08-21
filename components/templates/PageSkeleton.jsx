import { TableSkeleton } from "@/components/TableSkeleton";
import { PageContainer } from "@/components/templates/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton halaman generik buat loading.js.
 *
 * Bentuknya sengaja NIRU layout beneran: satu header berkaca di atas, terus
 * blok konten. Skeleton yang bentuknya beda dari halaman aslinya bikin layout
 * "melompat" pas data nyampe, dan lompatan itu kerasa lebih lama daripada
 * nunggu layar kosong — padahal durasinya sama.
 *
 * Dipakai lewat `width` yang sama kayak halaman tujuannya biar lebarnya pas.
 */
export function PageSkeleton({ width = "default", columns = 4, rows = 5, withTable = true }) {
    return (
        <PageContainer width={width}>
            {/* Bayangan PageHeader */}
            <div className="glass rounded-2xl p-5 md:p-6">
                <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-3.5">
                        <Skeleton className="bg-surface-3 h-11 w-11 shrink-0 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="bg-surface-3 h-6 w-44" />
                            <Skeleton className="bg-surface-3/70 h-3 w-56" />
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <Skeleton className="bg-surface-3 h-9 w-full md:w-56" />
                        <Skeleton className="bg-surface-3 h-9 w-24 shrink-0" />
                    </div>
                </div>
            </div>

            {withTable && <TableSkeleton rows={rows} columns={columns} />}
        </PageContainer>
    );
}
