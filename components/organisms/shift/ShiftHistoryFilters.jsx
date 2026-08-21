"use client";

import { RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Filter riwayat shift. Nilainya disimpen di URL (?from=&to=&admin=).
 *
 * Ini bagian terkecil dari ShiftHistoryTable yang beneran butuh interaktivitas.
 * Tabelnya sendiri dirender server pakai nilai-nilai ini.
 *
 * Tiap ganti filter, `page` dibuang — kalau nggak, user bisa nyangkut di
 * halaman 5 dari hasil yang cuma punya 1 halaman, dan liat tabel kosong tanpa
 * tau kenapa.
 */
export function ShiftHistoryFilters({ admins, startDate, endDate, adminId, defaultStartDate, defaultEndDate }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const push = (changes) => {
        const params = new URLSearchParams(searchParams);

        for (const [key, value] of Object.entries(changes)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        params.delete("page");

        startTransition(() => {
            router.replace(`${pathname}?${params}`, { scroll: false });
        });
    };

    const isFiltered = startDate !== defaultStartDate || endDate !== defaultEndDate || Boolean(adminId);

    const reset = () => {
        const params = new URLSearchParams(searchParams);
        for (const key of ["from", "to", "admin", "page"]) params.delete(key);

        const query = params.toString();
        startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        });
    };

    return (
        <div className="border-border bg-surface-1/60 flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-1.5">
                <Label htmlFor="shift-from" className="text-muted-foreground text-xs">
                    Dari tanggal
                </Label>
                <Input id="shift-from" type="date" value={startDate} max={endDate} onChange={(e) => push({ from: e.target.value })} disabled={isPending} className="border-border bg-input/60 text-foreground h-9" />
            </div>

            <div className="flex-1 space-y-1.5">
                <Label htmlFor="shift-to" className="text-muted-foreground text-xs">
                    Sampai tanggal
                </Label>
                <Input id="shift-to" type="date" value={endDate} min={startDate} onChange={(e) => push({ to: e.target.value })} disabled={isPending} className="border-border bg-input/60 text-foreground h-9" />
            </div>

            <div className="flex-1 space-y-1.5">
                <Label htmlFor="shift-admin" className="text-muted-foreground text-xs">
                    Admin
                </Label>
                <select id="shift-admin" value={adminId} onChange={(e) => push({ admin: e.target.value })} disabled={isPending} className="border-border bg-input/60 text-foreground focus-visible:border-ring focus-visible:ring-ring/30 h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3">
                    <option value="">Semua admin</option>
                    {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                            {admin.username}
                        </option>
                    ))}
                </select>
            </div>

            {isFiltered && (
                <Button variant="outline" size="sm" onClick={reset} disabled={isPending} className="h-9 shrink-0">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                </Button>
            )}
        </div>
    );
}
