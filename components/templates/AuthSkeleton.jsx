import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton buat halaman auth.
 *
 * Kenapa ini perlu ada terpisah: `app/loading.js` bikin Suspense boundary di
 * segmen ROOT, dan boundary itu nyelimutin semua anaknya — termasuk /login dan
 * /reset-password. Tanpa file ini, navigasi ke halaman login bisa nampilin
 * skeleton TABEL sekejap, dan itu kelihatan seperti bug.
 *
 * Bentuknya niru AuthShell: kartu sempit di tengah, tile logo, judul, dua field.
 */
export function AuthSkeleton({ fields = 2 }) {
    return (
        <main className="flex min-h-[calc(100vh-2rem)] w-full items-center justify-center px-4 py-12">
            <div className="glass w-full max-w-md rounded-3xl p-7 md:p-8">
                <div className="flex flex-col items-center">
                    <Skeleton className="bg-surface-3 mb-5 h-16 w-16 rounded-2xl" />
                    <Skeleton className="bg-surface-3 h-7 w-36" />
                    <Skeleton className="bg-surface-3/70 mt-3 h-5 w-44" />
                    <Skeleton className="bg-surface-3/70 mt-2 h-3.5 w-56" />
                </div>

                <div className="mt-7 space-y-5">
                    {Array.from({ length: fields }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="bg-surface-3/70 h-3.5 w-28" />
                            <Skeleton className="bg-surface-3 h-10 w-full" />
                        </div>
                    ))}
                    <Skeleton className="bg-surface-3 h-11 w-full" />
                </div>
            </div>
        </main>
    );
}
