"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Pager berbasis URL (?page=N).
 *
 * Pakai <Link>, bukan onClick + router.push, karena:
 *   - Ctrl/klik-tengah bisa buka halaman berikutnya di tab baru.
 *   - Next bisa prefetch halaman berikutnya, jadi klik-nya kerasa instan.
 *   - Tetep berfungsi walau JS-nya gagal load.
 *
 * `page` di URL 1-based (biar manusiawi), tapi query DB pakai 0-based.
 * Konversinya dilakuin di page.js, bukan di sini.
 */
export function Pagination({ page, pageCount, total, pageSize, className }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (pageCount <= 1) return null;

    const hrefFor = (target) => {
        const params = new URLSearchParams(searchParams);
        if (target <= 1) params.delete("page");
        else params.set("page", String(target));

        const query = params.toString();
        return query ? `${pathname}?${query}` : pathname;
    };

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    const hasPrev = page > 1;
    const hasNext = page < pageCount;

    return (
        <nav aria-label="Navigasi halaman" className={cn("border-border bg-surface-2/50 flex items-center justify-between gap-4 border-t px-4 py-3", className)}>
            {/* Selalu kasih tau POSISI, bukan cuma nomor halaman. "1-20 dari 137"
                ngasih tau user seberapa banyak yang belum dia lihat. */}
            <p className="text-muted-foreground text-xs">
                <span className="text-foreground font-medium">
                    {from}–{to}
                </span>{" "}
                dari <span className="text-foreground font-medium">{total}</span>
            </p>

            <div className="flex items-center gap-1.5">
                {hasPrev ? (
                    <Link href={hrefFor(page - 1)} scroll={false} aria-label="Halaman sebelumnya">
                        <Button variant="outline" size="sm">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Sebelumnya</span>
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Sebelumnya</span>
                    </Button>
                )}

                <span className="text-muted-foreground px-2 font-mono text-xs">
                    {page} / {pageCount}
                </span>

                {hasNext ? (
                    <Link href={hrefFor(page + 1)} scroll={false} aria-label="Halaman berikutnya">
                        <Button variant="outline" size="sm">
                            <span className="hidden sm:inline">Berikutnya</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        <span className="hidden sm:inline">Berikutnya</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </nav>
    );
}
