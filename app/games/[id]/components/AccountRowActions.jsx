"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { unlinkAccountFromGame, updateAccountGameLink } from "@/app/games/[id]/actions";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function EditLinkForm({ gameId, accountGame, required, onClose }) {
    const [link, setLink] = useState(accountGame.private_server_link ?? "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSaving(true);
        const result = await updateAccountGameLink({ gameId, accountGameId: accountGame.id, link, required });
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
            <FormField label="Link private server" id="ag-link" required={required} hint={required ? "Game ini wajib punya link." : "Boleh dikosongin."}>
                <Input id="ag-link" placeholder="https://www.roblox.com/games/..." value={link} onChange={(e) => setLink(e.target.value)} required={required} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
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

export function AccountRowActions({ gameId, gameName, requiresPrivateServer, accountGame }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const username = accountGame.accounts?.username ?? "akun ini";

    const runUnlink = () => {
        startTransition(async () => {
            const result = await unlinkAccountFromGame({ gameId, accountGameId: accountGame.id, accountId: accountGame.account_id });
            if (result?.error) {
                toast.error("Gagal lepas akun", { description: result.error });
                return;
            }
            toast.success(`${username} dilepas dari ${gameName}`);
        });
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <ActionIcon icon={Pencil} variant="edit" title="Edit link private server" onClick={() => setIsEditOpen(true)} />

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} variant="delete" title="Lepas akun dari game" disabled={isPending} />}
                title="Lepas akun dari game ini?"
                description={
                    <>
                        Tautan <strong className="text-foreground">{username}</strong> ke <strong className="text-foreground">{gameName}</strong> bakal dihapus, <strong className="text-foreground">termasuk item game ini</strong> yang kecatat di akun itu.
                    </>
                }
                confirmText="Lepas akun"
                onConfirm={runUnlink}
            />

            <FormDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit private server link" description={username}>
                {isEditOpen && <EditLinkForm key={accountGame.id} gameId={gameId} accountGame={accountGame} required={requiresPrivateServer} onClose={() => setIsEditOpen(false)} />}
            </FormDialog>
        </div>
    );
}
