"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createAccountFromDialog, loadPrivateServerConfig, savePrivateServerConfig } from "@/app/games/actions";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { FormDialog } from "@/components/molecules/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eldoradoIconUrl } from "@/lib/templateVars";

/**
 * Atur akun + private server link buat satu game dari library Eldorado.
 *
 * Game-nya gak disimpen manual: baris `games` lokal dibikin on demand waktu
 * link pertama disimpen, dan ditautin ke Eldorado lewat `eldorado_game_id`.
 * Relasi akun↔game tetep many-to-many di `account_games`.
 *
 * YANG BERUBAH: lima operasi tulis di sini dulu jalan langsung dari browser
 * (bikin game, hapus tautan, hapus stok item, update link, insert link) dengan
 * hanya RLS sebagai penjaga. Sekarang semuanya satu Server Action —
 * `savePrivateServerConfig` — yang dicek auth dan yang juga nolak link kembar
 * di server, bukan cuma di dialog ini.
 */
function PrivateServerForm({ eldoradoGameId, gameName, onSaved, onClose }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [allAccounts, setAllAccounts] = useState([]);
    const [rows, setRows] = useState([]);
    const [removedRows, setRemovedRows] = useState([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const result = await loadPrivateServerConfig(eldoradoGameId);
            if (cancelled) return;

            if (result?.error) {
                toast.error("Gagal ngambil data", { description: result.error });
                setIsLoading(false);
                return;
            }

            setAllAccounts(result.allAccounts);
            setRows(result.rows);
            setIsLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [eldoradoGameId]);

    const availableAccounts = allAccounts.filter((acc) => !rows.some((row) => row.accountId === acc.id));

    const addAccount = (account) => {
        setRows((prev) => [...prev, { accountGameId: null, accountId: account.id, username: account.username, link: "" }]);
    };

    const changeLink = (accountId, link) => {
        setRows((prev) => prev.map((row) => (row.accountId === accountId ? { ...row, link } : row)));
    };

    const removeRow = (accountId) => {
        const row = rows.find((r) => r.accountId === accountId);
        // Cuma baris yang UDAH ada di DB yang perlu dicabut di server.
        // Baris yang baru ditambah di dialog tinggal dibuang dari state.
        if (row?.accountGameId) {
            setRemovedRows((prev) => [...prev, { accountGameId: row.accountGameId, accountId: row.accountId }]);
        }
        setRows((prev) => prev.filter((r) => r.accountId !== accountId));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await savePrivateServerConfig({ eldoradoGameId, gameName, rows, removedRows });
        setIsSaving(false);

        if (result?.partial) {
            toast.warning("Sebagian gagal disimpen", { description: result.error });
            onSaved?.();
            return;
        }

        if (result?.error) {
            toast.error("Gagal nyimpen", { description: result.error });
            return;
        }

        toast.success(`Link private server ${gameName} keupdate`);
        onSaved?.();
        onClose();
    };

    if (isLoading) {
        return (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ngambil data akun...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-muted-foreground">Tambah akun</Label>
                <ComboboxSelect
                    items={availableAccounts}
                    value=""
                    onSelect={addAccount}
                    getItemValue={(acc) => acc.username}
                    placeholder={availableAccounts.length > 0 ? "-- Pilih akun --" : "Semua akun udah ditautin"}
                    searchPlaceholder="Cari atau tulis akun baru..."
                    emptyText="Akun itu belum kedaftar."
                    onCreateNew={async (username) => {
                        const result = await createAccountFromDialog(username);
                        if (result?.error) {
                            toast.error("Gagal bikin akun", { description: result.error });
                            return;
                        }
                        setAllAccounts((prev) => [...prev, result.account].sort((a, b) => a.username.localeCompare(b.username)));
                        addAccount(result.account);
                    }}
                    createNewLabel={(term) => `Daftarin "${term}"`}
                />
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground">Akun di game ini ({rows.length})</Label>

                {rows.length > 0 ? (
                    <div className="custom-scrollbar max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                        {rows.map((row) => (
                            <div key={row.accountId} className="border-border bg-surface-1/50 flex items-center gap-2 rounded-lg border p-2">
                                <span className="text-foreground w-28 shrink-0 truncate text-sm font-medium" title={row.username}>
                                    {row.username}
                                </span>
                                <Input placeholder="https://www.roblox.com/share?code=..." value={row.link} onChange={(e) => changeLink(row.accountId, e.target.value)} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9 text-xs" />
                                <ActionIcon icon={Trash2} variant="delete" title="Cabut akun dari game ini" onClick={() => removeRow(row.accountId)} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="border-border bg-surface-2/30 text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">Belum ada akun buat game ini.</p>
                )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Batal
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSaving} className="font-semibold">
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Nyimpen...
                        </>
                    ) : (
                        "Simpen"
                    )}
                </Button>
            </div>
        </div>
    );
}

export function GamePrivateServerDialog({ open, onOpenChange, game, onSaved }) {
    const gameName = game?.menuGameTitle || game?.gameName || "";
    const eldoradoGameId = game?.gameId ? String(game.gameId) : null;

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Private server link" description={gameName} maxWidth="sm:max-w-2xl">
            {open && eldoradoGameId && (
                <div className="space-y-4 pt-1">
                    <div className="border-border bg-surface-1/50 flex items-center gap-3 rounded-lg border p-3">
                        <div className="border-border bg-surface-3 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                            {/* Host gambarnya CDN Eldorado — next/image butuh allowlist domain. */}
                            <img src={eldoradoIconUrl(eldoradoGameId)} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-foreground truncate font-semibold">{gameName}</p>
                            <p className="text-muted-foreground font-mono text-xs">ID {eldoradoGameId}</p>
                        </div>
                    </div>

                    {/* key: ganti game -> form fresh, gak nyisa baris game sebelumnya */}
                    <PrivateServerForm key={eldoradoGameId} eldoradoGameId={eldoradoGameId} gameName={gameName} onSaved={onSaved} onClose={() => onOpenChange(false)} />
                </div>
            )}
        </FormDialog>
    );
}
