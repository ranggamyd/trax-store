"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createAccountForGame, linkAccountToGame } from "@/app/games/[id]/actions";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LinkAccountForm({ game, allAccounts, gameItems, onClose }) {
    const [accounts, setAccounts] = useState(allAccounts);
    const [accountId, setAccountId] = useState("");
    const [link, setLink] = useState("");
    const [itemRows, setItemRows] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const needsLink = Boolean(game.requires_private_server);

    const patchRow = (index, changes) => {
        setItemRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const items = itemRows.filter((row) => row.itemId || row.newName?.trim()).map((row) => ({ itemId: row.itemId || null, newName: row.newName?.trim() || "" }));

        setIsSaving(true);
        const result = await linkAccountToGame({ gameId: game.id, accountId, privateServerLink: link, items });
        setIsSaving(false);

        if (result?.error) {
            toast.error("Gagal nautin akun", { description: result.error });
            return;
        }

        toast.success("Akun ketaut ke game ini", {
            description: result.itemsAdded > 0 ? `Plus ${result.itemsAdded} item ikut ditambahin.` : undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Akun Roblox" id="link-account" required>
                <ComboboxSelect
                    items={accounts}
                    value={accountId}
                    onSelect={(acc) => setAccountId(acc.id)}
                    getItemValue={(acc) => acc.username}
                    placeholder="-- Pilih akun --"
                    searchPlaceholder="Cari username..."
                    emptyText="Akun itu belum kedaftar."
                    onCreateNew={async (username) => {
                        const result = await createAccountForGame(username);
                        if (result?.error) {
                            toast.error("Gagal bikin akun", { description: result.error });
                            return;
                        }
                        setAccounts((prev) => [...prev, result.account]);
                        setAccountId(result.account.id);
                        toast.success(`Akun "${result.account.username}" didaftarin`);
                    }}
                    createNewLabel={(term) => `Daftarin akun "${term}"`}
                    renderItem={(acc) => (
                        <span className="flex w-full items-center justify-between gap-2">
                            <span className="truncate">{acc.username}</span>
                            {acc.status === "EMPTY_ROBUX" && <span className="text-danger shrink-0 text-[10px]">robux habis</span>}
                        </span>
                    )}
                />
            </FormField>

            <FormField label="Link private server" id="link-ps" required={needsLink} hint={needsLink ? "Game ini wajib punya link." : "Boleh dikosongin."}>
                <Input id="link-ps" placeholder="https://www.roblox.com/games/..." value={link} onChange={(e) => setLink(e.target.value)} required={needsLink} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            {accountId && (
                <div className="border-border space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <Label>Item yang ada di akun ini (opsional)</Label>
                        <Button type="button" variant="outline" size="xs" onClick={() => setItemRows((rows) => [...rows, { itemId: "", newName: "" }])}>
                            <Plus className="mr-1 h-3 w-3" /> Baris item
                        </Button>
                    </div>

                    {itemRows.length === 0 && <p className="text-muted-foreground text-xs">Bisa ditambahin nanti dari tab Item.</p>}

                    {itemRows.map((row, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <ComboboxSelect items={gameItems} value={row.itemId} onSelect={(item) => patchRow(index, { itemId: item.id, newName: "" })} getItemValue={(item) => item.item_name} placeholder={row.newName ? `Item baru: ${row.newName}` : "-- Pilih item --"} searchPlaceholder="Cari atau tulis nama item..." emptyText="Item itu belum ada di game ini." onCreateNew={(name) => patchRow(index, { itemId: "", newName: name })} createNewLabel={(term) => `Bikin item "${term}"`} />
                            <Button type="button" variant="ghost" size="icon" aria-label="Hapus baris item" onClick={() => setItemRows((rows) => rows.filter((_, i) => i !== index))} className="text-muted-foreground hover:bg-danger/10 hover:text-danger h-9 w-9 shrink-0">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Batal
                </Button>
                <Button type="submit" className="font-semibold" disabled={isSaving || !accountId}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Nautin...
                        </>
                    ) : (
                        "Tautin akun"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function LinkAccountDialog({ game, allAccounts, gameItems, open, onOpenChange }) {
    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Tautin akun ke game" description={`Nandain bahwa akun ini bisa dipakai buat ${game.name}.`} maxWidth="sm:max-w-lg">
            {open && <LinkAccountForm key={game.id} game={game} allAccounts={allAccounts} gameItems={gameItems} onClose={() => onOpenChange(false)} />}
        </FormDialog>
    );
}
