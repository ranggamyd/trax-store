"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { addItemToAccount, createGame } from "@/app/accounts/[id]/actions";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";

function AddItemForm({ accountId, allGames, onClose }) {
    const [games, setGames] = useState(allGames);
    const [gameId, setGameId] = useState("");
    const [item, setItem] = useState({ id: null, name: "" });
    const [isSaving, setIsSaving] = useState(false);

    const selectedGame = games.find((g) => g.id === gameId) ?? null;
    const canSubmit = Boolean(gameId) && Boolean(item.id || item.name.trim());

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSaving(true);
        const result = await addItemToAccount({ accountId, gameId, itemId: item.id, itemName: item.name });
        setIsSaving(false);

        if (result?.error) {
            toast.error("Gagal nambah item", { description: result.error });
            return;
        }

        toast.success(`Item "${item.name || "terpilih"}" ketaut ke akun ini`);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Game" id="add-item-game" required hint="Item selalu nempel ke satu game.">
                <ComboboxSelect
                    items={games}
                    value={gameId}
                    onSelect={(g) => {
                        setGameId(g.id);
                        setItem({ id: null, name: "" });
                    }}
                    placeholder="-- Pilih game --"
                    searchPlaceholder="Cari game..."
                    emptyText="Game itu belum ada di daftar."
                    onCreateNew={async (name) => {
                        const result = await createGame(name);
                        if (result?.error) {
                            toast.error("Gagal bikin game", { description: result.error });
                            return;
                        }
                        setGames((prev) => [...prev, result.game]);
                        setGameId(result.game.id);
                        setItem({ id: null, name: "" });
                    }}
                    createNewLabel={(term) => `Bikin game "${term}"`}
                />
            </FormField>

            <FormField label="Item" id="add-item-item" required hint={selectedGame ? "Kalau belum ada, tulis namanya — nanti dibikin otomatis." : "Pilih game-nya dulu."}>
                <ComboboxSelect items={selectedGame?.items ?? []} value={item.id} disabled={!selectedGame} onSelect={(picked) => setItem({ id: picked.id, name: picked.item_name })} getItemValue={(picked) => picked.item_name} placeholder={item.name || (selectedGame ? "-- Pilih item --" : "Pilih game dulu")} searchPlaceholder="Cari atau tulis nama item..." emptyText="Item itu belum ada di game ini." onCreateNew={(name) => setItem({ id: null, name })} createNewLabel={(term) => `Bikin item "${term}"`} />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Batal
                </Button>
                <Button type="submit" className="font-semibold" disabled={isSaving || !canSubmit}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Nautin...
                        </>
                    ) : (
                        "Tautin item"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function AddItemDialog({ accountId, allGames, open, onOpenChange }) {
    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Tautin item ke akun" description="Nandain bahwa akun ini punya item tersebut." maxWidth="sm:max-w-md">
            {open && <AddItemForm key={accountId} accountId={accountId} allGames={allGames} onClose={() => onOpenChange(false)} />}
        </FormDialog>
    );
}
