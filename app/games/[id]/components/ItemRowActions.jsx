"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteGameItem } from "@/app/games/[id]/actions";
import { GameItemDialog } from "@/app/games/[id]/components/GameItemDialog";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";

export function ItemRowActions({ game, item, allAccounts }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const runDelete = () => {
        startTransition(async () => {
            const result = await deleteGameItem({ gameId: game.id, itemId: item.id });
            if (result?.error) {
                toast.error("Gagal hapus item", { description: result.error });
                return;
            }
            toast.success(`Item "${item.item_name}" dihapus`);
        });
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <ActionIcon icon={Pencil} variant="edit" title="Edit item" onClick={() => setIsEditOpen(true)} />

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} variant="delete" title="Hapus item" disabled={isPending} />}
                title="Hapus item ini?"
                description={
                    <>
                        <strong className="text-foreground">{item.item_name}</strong> bakal dihapus dari game ini, bareng semua catatan stoknya di akun mana pun. Gak bisa dibalikin.
                    </>
                }
                confirmText="Hapus item"
                onConfirm={runDelete}
            />

            <GameItemDialog game={game} item={item} allAccounts={allAccounts} open={isEditOpen} onOpenChange={setIsEditOpen} />
        </div>
    );
}
