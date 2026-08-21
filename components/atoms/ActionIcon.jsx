import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tombol ikon buat aksi di baris tabel.
 *
 * Semua warna pindah ke token. Yang juga dibenerin: state default-nya dulu
 * `text-zinc-500` — terlalu redup, jadi tombol aksinya nyaris gak kelihatan
 * sampai user nyapu mouse ke situ. Sekarang `text-muted-foreground` yang
 * kontrasnya lolos AA, jadi affordance-nya kebaca tanpa perlu di-hover dulu.
 *
 * `active:scale-95` ngasih umpan balik taktil pas diklik — micro-interaction
 * paling murah yang bikin UI kerasa responsif.
 */
const VARIANTS = {
    default: "text-muted-foreground hover:text-foreground hover:bg-surface-3",
    edit: "text-muted-foreground hover:text-accent hover:bg-accent/10",
    delete: "text-muted-foreground hover:text-danger hover:bg-danger/10",
    copy: "text-muted-foreground hover:text-foreground hover:bg-surface-3",
    success: "text-muted-foreground hover:text-success hover:bg-success/10",
    warning: "text-muted-foreground hover:text-warning hover:bg-warning/10",
    primary: "text-muted-foreground hover:text-primary hover:bg-primary/10",
};

export function ActionIcon({ icon: Icon, onClick, variant = "default", title, className, disabled }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={title}
            className={cn("h-8 w-8 rounded-lg transition-all duration-150 active:scale-95", VARIANTS[variant] ?? VARIANTS.default, className)}
            title={title}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
            disabled={disabled}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}
