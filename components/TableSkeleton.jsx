import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Skeleton tabel.
 *
 * `"use client"` dicabut — komponen ini nol interaksi, nol hook, nol event.
 * Dulu dia ditandai client cuma karena ikut-ikutan, dan itu nyeret Table +
 * Skeleton ke bundle browser buat sesuatu yang bisa dirender di server.
 *
 * Lebar sel-nya sengaja BEDA-BEDA, gak seragam. Skeleton yang semua barnya
 * sama panjang kelihatan seperti komponen loading; yang panjangnya variatif
 * kelihatan seperti data yang sebentar lagi muncul — dan itu bikin nunggunya
 * kerasa lebih pendek walau durasinya sama.
 */
const WIDTHS = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-4/5"];

export function TableSkeleton({ rows = 5, columns = 3 }) {
    return (
        <div className="glass-subtle overflow-hidden rounded-2xl">
            <Table>
                <TableHeader className="bg-surface-2/80">
                    <TableRow className="border-border hover:bg-transparent">
                        {Array.from({ length: columns }).map((_, i) => (
                            <TableHead key={i} className="h-11">
                                <Skeleton className="bg-surface-3 h-3 w-20" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRow key={i} className="border-border hover:bg-transparent">
                            {Array.from({ length: columns }).map((_, j) => (
                                <TableCell key={j} className="py-4">
                                    <Skeleton className={`bg-surface-3/70 h-4 ${WIDTHS[(i + j) % WIDTHS.length]}`} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
