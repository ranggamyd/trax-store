"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { unlinkGameFromAccount, updatePrivateServerLink } from "@/app/accounts/[id]/actions";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Form edit link. Dipisah biar bisa di-remount lewat key waktu dialog dibuka. */
function EditLinkForm({ accountId, accountGame, onClose }) {
    const [link, setLink] = useState(accountGame.private_server_link ?? "");
    const [isSaving, setIsSaving] = useState(false);

    const required = Boolean(accountGame.games?.requires_private_server);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSaving(true);
        const result = await updatePrivateServerLink({ accountId, accountGameId: accountGame.id, link, required });
        setIsSaving(false);

        if (result?.error) {
            toast.error("Gagal simpen link", { description: result.error });
            return;
        }

        toast.success("Link kesimpen");
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Link private server" id="ps-link" required={required} hint={required ? "Game ini wajib punya link." : "Boleh dikosongin kalau game-nya gak butuh."}>
                <Input id="ps-link" placeholder="https://www.roblox.com/games/..." value={link} onChange={(e) => setLink(e.target.value)} required={required} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
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
                        "Simpen link"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function GameRowActions({ accountId, accountUsername, accountGame }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const gameName = accountGame.games?.name ?? "game ini";

    const runUnlink = () => {
        startTransition(async () => {
            const result = await unlinkGameFromAccount({ accountId, gameId: accountGame.game_id });
            if (result?.error) {
                toast.error("Gagal lepas game", { description: result.error });
                return;
            }
            toast.success(`"${gameName}" dilepas dari akun ini`);
        });
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <ActionIcon icon={Pencil} variant="edit" title="Edit link private server" onClick={() => setIsEditOpen(true)} />

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} variant="delete" title="Lepas game dari akun" disabled={isPending} />}
                title="Lepas game dari akun ini?"
                description={
                    <>
                        Tautan <strong className="text-foreground">{gameName}</strong> ke akun <strong className="text-foreground">{accountUsername}</strong> bakal dihapus, <strong className="text-foreground">termasuk semua item dari game ini</strong> yang nempel di akun ini.
                    </>
                }
                confirmText="Lepas game"
                onConfirm={runUnlink}
            />

            <FormDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit private server link" description={gameName}>
                {isEditOpen && <EditLinkForm key={accountGame.id} accountId={accountId} accountGame={accountGame} onClose={() => setIsEditOpen(false)} />}
            </FormDialog>
        </div>
    );
}
