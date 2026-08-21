"use client";

import { ArrowRightLeft, Loader2, Play, Square } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { endShift, startShift, takeoverShift } from "@/app/actions/shifts";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Button } from "@/components/ui/button";

/**
 * Tombol aksi shift: ambil / lepas / takeover.
 *
 * Perubahan penting: user id-nya UDAH GAK DIKIRIM dari sini. Versi lama manggil
 * `startShift(session.user.id)` dan `takeoverShift(id, session.user.id)` —
 * artinya klien yang nentuin shift itu punya siapa, dan siapa pun bisa mulai
 * shift atas nama admin lain. Sekarang server ngambilnya dari session.
 *
 * `useTransition` yang ngasih state pending. Habis action-nya kelar,
 * `revalidatePath` di server ngirim tampilan barunya — jadi gak ada state
 * salinan di klien yang bisa nyimpang dari isi database.
 */
export function ShiftActions({ activeShift, currentAdminId }) {
    const [isPending, startTransition] = useTransition();

    const run = (action, successMessage) => {
        startTransition(async () => {
            const result = await action();
            if (result?.error) {
                toast.error("Gagal", { description: result.error });
                return;
            }
            toast.success(successMessage);
        });
    };

    // Belum ada yang jaga -> tombol ambil shift.
    if (!activeShift) {
        return (
            <Button size="lg" className="bg-success text-success-foreground hover:bg-success/90 mt-2 gap-2 font-semibold" style={{ boxShadow: "0 0 24px rgb(52 211 153 / 0.3)" }} onClick={() => run(() => startShift(), "Shift dimulai. Selamat jaga.")} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Ambil shift
            </Button>
        );
    }

    const isMine = activeShift.user_id === currentAdminId;

    if (isMine) {
        return (
            <ConfirmDialog
                trigger={
                    <Button variant="ghost" className="border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 hover:text-danger gap-2 border" disabled={isPending}>
                        <Square className="h-4 w-4" />
                        <span className="hidden sm:inline">Lepas</span>
                    </Button>
                }
                title="Akhirin shift lu?"
                description="Habis ini gak ada yang jaga sampai orang lain ngambil. Durasinya kecatat di riwayat."
                confirmText="Lepas shift"
                tone="warning"
                onConfirm={() => run(() => endShift(activeShift.id), "Shift diakhirin. Kecatat di riwayat.")}
            />
        );
    }

    return (
        <ConfirmDialog
            trigger={
                <Button variant="ghost" className="border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 hover:text-warning gap-2 border" disabled={isPending}>
                    <ArrowRightLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Takeover</span>
                </Button>
            }
            title={`Ambil alih dari ${activeShift.username}?`}
            description="Shift dia langsung diakhirin dan dicatat sebagai takeover. Shift lu mulai detik itu juga."
            confirmText="Ambil alih"
            tone="warning"
            onConfirm={() => run(() => takeoverShift(activeShift.id), "Shift diambil alih. Sekarang giliran lu.")}
        />
    );
}
