"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteGame } from "@/app/games/[id]/actions";
import { GameEditDialog } from "@/app/games/[id]/components/GameEditDialog";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";

export function GameHeaderActions({ game, linkedAccountCount, itemCount }) {
    const router = useRouter();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const runDelete = () => {
        startTransition(async () => {
            const result = await deleteGame(game.id);
            if (result?.error) {
                toast.error("Gagal hapus game", { description: result.error });
                return;
            }
            toast.success(`Game "${game.name}" dihapus`);
            router.push("/games");
        });
    };

    return (
        <>
            <ActionIcon icon={Pencil} title="Edit game" variant="edit" onClick={() => setIsEditOpen(true)} className="h-10 w-10" />

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} title="Hapus game" variant="delete" disabled={isPending} className="h-10 w-10" />}
                title="Hapus game ini?"
                description={
                    <>
                        <strong className="text-foreground">{game.name}</strong> bakal dihapus permanen.
                        {/* Angka konkret, bukan "semua data terkait" yang kabur —
                            user berhak tau seberapa besar yang kena. */}
                        {(linkedAccountCount > 0 || itemCount > 0) && (
                            <>
                                {" "}
                                Ini bakal ngelepas <strong className="text-foreground">{linkedAccountCount} tautan akun</strong> dan <strong className="text-foreground">{itemCount} item</strong> yang nempel di game ini. Gak bisa dibalikin.
                            </>
                        )}
                    </>
                }
                confirmText="Hapus game"
                onConfirm={runDelete}
            />

            <GameEditDialog game={game} open={isEditOpen} onOpenChange={setIsEditOpen} />
        </>
    );
}
