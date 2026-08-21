import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Kolom pencarian.
 *
 * Warna pindah ke token. Yang juga dibenerin: ring fokusnya dulu `ring-accent`
 * (cyan) padahal cyan itu warna DATA di sistem yang baru, bukan warna aksi.
 * Sekarang ikut `--ring` (primary) supaya state fokus di seluruh app seragam —
 * user cuma perlu hafal satu warna buat "ini yang aktif".
 */
export function SearchBar({ value, onChange, placeholder = "Cari apa nih...", className, containerClassName }) {
    return (
        <div className={cn("relative w-full md:w-64", containerClassName)}>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input placeholder={placeholder} value={value} onChange={onChange} className={cn("text-foreground placeholder:text-muted-foreground/70 border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9 pl-9 transition-colors", className)} />
        </div>
    );
}
