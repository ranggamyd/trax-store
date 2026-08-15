"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TableSkeleton({ rows = 5, columns = 3 }) {
    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
            <Table>
                <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                        {Array.from({ length: columns }).map((_, i) => (
                            <TableHead key={i}>
                                <Skeleton className="h-4 w-24 bg-zinc-800" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRow key={i} className="border-zinc-800">
                            {Array.from({ length: columns }).map((_, j) => (
                                <TableCell key={j}>
                                    <Skeleton className="h-8 w-full bg-zinc-800/50" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
