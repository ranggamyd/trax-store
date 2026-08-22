"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createAccountForGame, saveGameItem } from "@/app/games/[id]/actions";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Bikin / edit item game.
 *
 * Mode EDIT cuma nama + deskripsi. Mode BIKIN wajib nyebut minimal satu akun
 * yang nyimpen item itu — item tanpa akun itu stok hantu: kelihatan ada di
 * daftar, tapi gak nempel di akun mana pun waktu mau dikirim ke buyer.
 */
function GameItemForm({ game, item, allAccounts, onClose }) {
    const isEdit = Boolean(item);

    const [accounts, setAccounts] = useState(allAccounts);
    const [itemName, setItemName] = useState(item?.item_name ?? "");
    const [description, setDescription] = useState(item?.description ?? "");
    const [rows, setRows] = useState(isEdit ? [] : [{ accountId: "", privateServerLink: "" }]);
    const [isSaving, setIsSaving] = useState(false);

    const needsLink = Boolean(game.requires_private_server);

    const patchRow = (index, changes) => {
        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSaving(true);
        const result = await saveGameItem({
            gameId: game.id,
            itemId: item?.id ?? null,
            itemName,
            description,
            accounts: isEdit ? [] : rows,
        });
        setIsSaving(false);

        if (result?.error && !result?.partial) {
            toast.error(isEdit ? "Gagal simpen item" : "Gagal bikin item", { description: result.error });
            return;
        }

        // Kasus separuh berhasil: item kebikin, stoknya gagal. Dulu ini
        // ditampilin sebagai toast.error biasa, jadi user gak tau item-nya
        // sebenernya udah ada dan cuma stoknya yang perlu dibenerin.
        if (result?.partial) {
            toast.warning("Item kebikin, tapi stoknya gagal", { description: result.error });
            onClose();
            return;
        }

        toast.success(isEdit ? "Item kesimpen" : `Item "${itemName}" kebikin`, {
            description: result?.accountsAttached ? `Kecatat di ${result.accountsAttached} akun.` : undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Nama item" id="item-name" required>
                <Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="misal: Dominus Frigidus" required className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            <FormField label="Deskripsi" id="item-desc" hint="Opsional. Cuma kelihatan di dashboard internal.">
                <Input id="item-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Catatan bebas..." className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            {!isEdit && (
                <div className="border-border space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <Label>
                            Akun yang nyimpen item ini<span className="text-danger ml-0.5">*</span>
                        </Label>
                        <Button type="button" variant="outline" size="xs" onClick={() => setRows((prev) => [...prev, { accountId: "", privateServerLink: "" }])}>
                            <Plus className="mr-1 h-3 w-3" /> Baris akun
                        </Button>
                    </div>

                    <p className="text-muted-foreground text-xs">{needsLink ? "Game ini wajib private server — tiap akun harus punya link." : "Minimal satu akun."}</p>

                    {rows.map((row, index) => (
                        <div key={index} className="border-border bg-surface-1/50 space-y-2 rounded-lg border p-2.5">
                            <div className="flex items-center gap-2">
                                <ComboboxSelect
                                    items={accounts}
                                    value={row.accountId}
                                    onSelect={(acc) => patchRow(index, { accountId: acc.id })}
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
                                        patchRow(index, { accountId: result.account.id });
                                    }}
                                    createNewLabel={(term) => `Daftarin akun "${term}"`}
                                />

                                {rows.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" aria-label="Hapus baris akun" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))} className="text-muted-foreground hover:bg-danger/10 hover:text-danger h-9 w-9 shrink-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <Input placeholder={needsLink ? "Link private server (wajib)" : "Link private server (opsional)"} value={row.privateServerLink} onChange={(e) => patchRow(index, { privateServerLink: e.target.value })} required={needsLink} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9 text-xs" />
                        </div>
                    ))}
                </div>
            )}

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
                    ) : isEdit ? (
                        "Simpen item"
                    ) : (
                        "Bikin item"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function GameItemDialog({ game, item = null, allAccounts, open, onOpenChange }) {
    const isEdit = Boolean(item);

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Edit item" : "Item baru"} description={isEdit ? item.item_name : `Item buat ${game.name}.`} maxWidth="sm:max-w-lg" className="custom-scrollbar max-h-[90vh] overflow-y-auto">
            {open && <GameItemForm key={item?.id ?? "new"} game={game} item={item} allAccounts={allAccounts} onClose={() => onOpenChange(false)} />}
        </FormDialog>
    );
}
