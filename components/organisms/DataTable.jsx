import { TableSkeleton } from "@/components/TableSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function DataTable({ columns, data, loading = false, emptyMessage = "Data nggak ketemu bro.", keyExtractor = (item) => item.id, renderRow }) {
    if (loading && (!data || data.length === 0)) {
        return <TableSkeleton rows={5} columns={columns.length} />;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
            <Table>
                <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800 hover:bg-zinc-900">
                        {columns.map((col, idx) => (
                            <TableHead key={idx} className={cn("font-bold text-zinc-400", col.className)}>
                                {col.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!data || data.length === 0 ? (
                        <TableRow className="border-zinc-800">
                            <TableCell colSpan={columns.length} className="py-8 text-center text-zinc-500">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => renderRow(item, index))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
