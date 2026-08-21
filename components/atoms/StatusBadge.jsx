import { cn } from "@/lib/utils";

/**
 * Badge status.
 *
 * Dua perubahan dari versi lama:
 *
 * 1. Warnanya pindah ke token semantik (--success/--warning/--danger), bukan
 *    `green-500` / `yellow-500` mentah. Jadi kalau nanti hijaunya mau digeser,
 *    cukup ganti satu token — bukan nyisir 700-an kelas hardcode.
 *
 * 2. Nambah titik indikator. Badge yang cuma beda WARNA itu gak kebaca sama
 *    ~8% cowok yang buta warna merah-hijau — dan "Tersedia" vs "Habis" persis
 *    pasangan yang paling sering ketuker. Titik + border ngasih pembeda kedua.
 */
const VARIANTS = {
    default: "bg-surface-3 text-muted-foreground border-border",
    success: "bg-success/12 text-success border-success/25",
    danger: "bg-danger/12 text-danger border-danger/25",
    warning: "bg-warning/12 text-warning border-warning/25",
    info: "bg-accent/12 text-accent border-accent/25",
    primary: "bg-primary/12 text-primary border-primary/25",
    accent: "bg-accent/12 text-accent border-accent/25",
};

export function StatusBadge({ children, variant = "default", withDot = true, className }) {
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase", VARIANTS[variant] ?? VARIANTS.default, className)}>
            {withDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
            {children}
        </span>
    );
}
