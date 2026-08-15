import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

/**
 * Reusable confirm dialog component.
 * Replaces 15+ copy-pasted AlertDialog blocks across the codebase.
 *
 * Props:
 * - trigger: ReactNode (the element that opens the dialog)
 * - title: string
 * - description: string or ReactNode
 * - onConfirm: () => void
 * - confirmText: string (default: "Ya, Hapus")
 * - cancelText: string (default: "Batal")
 * - confirmClassName: string (default: red destructive)
 */
export function ConfirmDialog({ trigger, title = "Yakin mau hapus?", description = "Tindakan ini gak bisa di-undo lho bos.", onConfirm, confirmText = "Ya, Hapus", cancelText = "Batal", confirmClassName = "bg-red-600 hover:bg-red-700 text-white font-bold" }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent className="text-foreground border-zinc-800 bg-zinc-950">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-500">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className={confirmClassName}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
