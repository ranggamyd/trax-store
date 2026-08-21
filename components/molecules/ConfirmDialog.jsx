import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Dialog konfirmasi. Gantiin 15+ blok AlertDialog yang di-copy-paste.
 *
 * Yang diubah:
 *
 * 1. Warna ke token semantik. `text-red-500` / `bg-red-600` jadi `danger`.
 *
 * 2. Tombol konfirmasi default-nya "Ya, Hapus" — sekarang bisa (dan sebaiknya)
 *    diisi kata kerja spesifik. Tombol yang nyebut AKSI-nya ("Hapus akun")
 *    jauh lebih kecil kemungkinannya diklik ngawur daripada "Ya" atau "OK",
 *    karena user baca tombolnya, bukan judul dialognya.
 *
 * 3. `tone` bisa "danger" (default) atau "warning" — aksi yang bisa dibalikin
 *    gak perlu dikasih warna yang sama kayak aksi permanen. Kalau semua
 *    konfirmasi merah, merahnya berhenti berarti.
 */
const TONES = {
    danger: {
        title: "text-danger",
        action: "bg-danger text-danger-foreground hover:bg-danger/90 font-semibold",
    },
    warning: {
        title: "text-warning",
        action: "bg-warning text-warning-foreground hover:bg-warning/90 font-semibold",
    },
};

export function ConfirmDialog({ trigger, title = "Yakin mau hapus?", description = "Aksi ini gak bisa dibatalin.", onConfirm, confirmText = "Ya, hapus", cancelText = "Batal", tone = "danger", confirmClassName }) {
    const toneStyles = TONES[tone] ?? TONES.danger;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-popover text-foreground rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className={cn("text-base font-semibold tracking-tight", toneStyles.title)}>{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="border-border bg-surface-2 hover:bg-surface-3 text-foreground">{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className={cn(toneStyles.action, confirmClassName)}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
