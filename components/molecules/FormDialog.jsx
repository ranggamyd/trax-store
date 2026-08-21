import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Pembungkus dialog form. Ngilangin boilerplate Dialog+Content+Header+Title.
 *
 * Perubahan dari versi lama:
 *
 * 1. Warna ke token (dulu `border-zinc-800 bg-zinc-950`).
 *
 * 2. `titleClassName` default-nya dulu "text-glow-accent" — jadi SETIAP dialog
 *    judulnya nyala. Glow di dialog itu salah sasaran: yang penting di dialog
 *    adalah field-nya, bukan judulnya. Sekarang default-nya polos.
 *
 * 3. Nambah `description`. Dialog yang cuma punya judul kayak "Edit" gak
 *    ngasih tau user dia sedang ngedit APA — dan itu penyebab paling umum
 *    orang nyimpen perubahan ke baris yang salah.
 */
export function FormDialog({ open, onOpenChange, title, description, titleClassName, children, maxWidth, className }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("border-border bg-popover text-foreground rounded-2xl p-5 sm:max-w-md", maxWidth, className)}>
                <DialogHeader>
                    <DialogTitle className={cn("text-lg font-semibold tracking-tight", titleClassName)}>{title}</DialogTitle>
                    {description && <DialogDescription className="text-muted-foreground text-sm">{description}</DialogDescription>}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
