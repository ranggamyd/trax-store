"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createGame, linkGameToAccount } from "@/app/accounts/[id]/actions";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Dialog "tautin game ke akun".
 *
 * Isinya dipisah jadi <LinkGameForm> supaya bisa DI-REMOUNT lewat `key` waktu
 * dialog dibuka. Versi lama nyimpen state-nya di halaman dan nge-reset manual
 * pakai `resetAddGame()` yang harus dipanggil di tiga tempat berbeda — dan satu
 * jalur (tutup dialog pakai Esc) kelewat, jadi pilihan lama masih nyangkut pas
 * dibuka lagi.
 */
function LinkGameForm({ accountId, allGames, onClose }) {
    const [games, setGames] = useState(allGames);
    const [gameId, setGameId] = useState("");
    const [link, setLink] = useState("");
    const [itemRows, setItemRows] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const selectedGame = games.find((g) => g.id === gameId) ?? null;
    const needsLink = Boolean(selectedGame?.requires_private_server);
    const gameItems = selectedGame?.items ?? [];

    const patchRow = (index, changes) => {
        setItemRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!gameId) {
            toast.error("Game-nya belum dipilih");
            return;
        }

        const items = itemRows.filter((row) => row.itemId || row.newName?.trim()).map((row) => ({ itemId: row.itemId || null, newName: row.newName?.trim() || "" }));

        setIsSaving(true);
        const result = await linkGameToAccount({ accountId, gameId, privateServerLink: link, items });
        setIsSaving(false);

        if (result?.error) {
            toast.error("Gagal nautin game", { description: result.error });
            return;
        }

        toast.success(`"${result.gameName}" ketaut`, {
            description: result.itemsAdded > 0 ? `Plus ${result.itemsAdded} item ikut ditambahin.` : undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Game" id="link-game" required>
                <ComboboxSelect
                    items={games}
                    value={gameId}
                    onSelect={(g) => setGameId(g.id)}
                    placeholder="-- Pilih game --"
                    searchPlaceholder="Cari nama game..."
                    emptyText="Game itu belum ada di daftar."
                    onCreateNew={async (name) => {
                        const result = await createGame(name);
                        if (result?.error) {
                            toast.error("Gagal bikin game", { description: result.error });
                            return;
                        }
                        setGames((prev) => [...prev, result.game]);
                        setGameId(result.game.id);
                        toast.success(`Game "${result.game.name}" dibikin`);
                    }}
                    createNewLabel={(term) => `Bikin game "${term}"`}
                    renderItem={(g) => (
                        <span className="flex w-full items-center justify-between gap-2">
                            <span className="truncate">{g.name}</span>
                            {g.requires_private_server && <span className="border-warning/30 bg-warning/12 text-warning shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold">WAJIB LINK</span>}
                        </span>
                    )}
                />
            </FormField>

            {needsLink && (
                <FormField label="Link private server" id="link-ps" required hint="Game ini gak bisa ditautin tanpa link.">
                    <Input id="link-ps" placeholder="https://www.roblox.com/games/..." value={link} onChange={(e) => setLink(e.target.value)} required className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
                </FormField>
            )}

            {gameId && (
                <div className="border-border space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <Label>Item dari game ini (opsional)</Label>
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
                <Button type="submit" className="font-semibold" disabled={isSaving || !gameId}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Nautin...
                        </>
                    ) : (
                        "Tautin game"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function LinkGameDialog({ accountId, allGames, open, onOpenChange }) {
    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Tautin game ke akun" description="Sekalian bisa masukin item yang tersedia di akun ini." maxWidth="sm:max-w-lg">
            {open && <LinkGameForm key={accountId} accountId={accountId} allGames={allGames} onClose={() => onOpenChange(false)} />}
        </FormDialog>
    );
}
