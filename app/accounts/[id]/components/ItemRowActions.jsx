"use client";

import { Loader2, PackageCheck, PackageX, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { removeAccountItem, toggleItemAvailability, updateItemNotes } from "@/app/accounts/[id]/actions";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function EditNotesForm({ accountId, accountItem, onClose }) {
    const [notes, setNotes] = useState(accountItem.stock_notes ?? "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSaving(true);
        const result = await updateItemNotes({ accountId, accountItemId: accountItem.id, notes });
        setIsSaving(false);

        if (result?.error) {
            toast.error("Gagal simpen catatan", { description: result.error });
            return;
        }

        toast.success("Catatan kesimpen");
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Catatan stok" id="stock-notes" hint="Cuma kelihatan di dashboard internal.">
                <Input id="stock-notes" placeholder="misal: udah laku, dipindah ke akun lain..." value={notes} onChange={(e) => setNotes(e.target.value)} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Batal
                </Button>
                <Button type="submit" className="font-semibold" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Nyimpen...
                        </>
                    ) : (
                        "Simpen catatan"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function ItemRowActions({ accountId, accountItem }) {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const itemName = accountItem.items?.item_name ?? "item ini";
    const isAvailable = accountItem.is_available;

    const runToggle = () => {
        startTransition(async () => {
            const result = await toggleItemAvailability({ accountId, accountItemId: accountItem.id });
            if (result?.error) {
                toast.error("Gagal ganti status stok", { description: result.error });
                return;
            }
            toast.success(result.isAvailable ? `${itemName}: tersedia` : `${itemName}: habis`);
        });
    };

    const runRemove = () => {
        startTransition(async () => {
            const result = await removeAccountItem({ accountId, accountItemId: accountItem.id, gameId: accountItem.items?.game_id });

            if (result?.error) {
                toast.error("Gagal hapus item", { description: result.error });
                return;
            }

            // Efek samping ini dulu kejadian diem-diem. Sekarang dikasih tau.
            toast.success(`"${itemName}" dihapus dari akun`, {
                description: result.gameUnlinked ? "Itu item terakhir dari game itu, jadi tautan game-nya ikut dilepas." : undefined,
            });
        });
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <ActionIcon icon={Pencil} variant="edit" title="Edit catatan" onClick={() => setIsNotesOpen(true)} />

            <ActionIcon icon={isAvailable ? PackageX : PackageCheck} variant={isAvailable ? "warning" : "success"} title={isAvailable ? "Tandai habis / terjual" : "Tandai tersedia"} onClick={runToggle} disabled={isPending} />

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} variant="delete" title="Hapus item dari akun" disabled={isPending} />}
                title="Hapus item dari akun ini?"
                description={
                    <>
                        <strong className="text-foreground">{itemName}</strong> bakal dilepas dari akun ini. Kalau ini item terakhir dari game tersebut, tautan game-nya juga ikut dilepas.
                    </>
                }
                confirmText="Hapus item"
                onConfirm={runRemove}
            />

            <FormDialog open={isNotesOpen} onOpenChange={setIsNotesOpen} title="Edit catatan item" description={itemName}>
                {isNotesOpen && <EditNotesForm key={accountItem.id} accountId={accountId} accountItem={accountItem} onClose={() => setIsNotesOpen(false)} />}
            </FormDialog>
        </div>
    );
}
