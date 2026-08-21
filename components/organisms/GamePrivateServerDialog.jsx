"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { FormDialog } from "@/components/molecules/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { createAccountFromCombo, isDuplicateError } from "@/lib/supabaseHelpers";
import { eldoradoIconUrl } from "@/lib/templateVars";

/**
 * Atur akun + private server link buat satu game dari Eldorado library.
 * Game-nya gak disimpen manual lagi, jadi baris `games` lokal dibikin on demand
 * pas nyimpen dan ditautin ke Eldorado lewat kolom `eldorado_game_id`.
 * Relasinya tetep many-to-many di `account_games` (1 game banyak akun, 1 akun banyak game).
 */
export function GamePrivateServerDialog({ open, onOpenChange, game, onSaved }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gameRow, setGameRow] = useState(null);
    const [allAccounts, setAllAccounts] = useState([]);
    const [rows, setRows] = useState([]);
    const [removedRows, setRemovedRows] = useState([]);

    const gameName = game?.menuGameTitle || game?.gameName || "";
    const eldoradoGameId = game?.gameId ? String(game.gameId) : null;

    useEffect(() => {
        if (!open || !eldoradoGameId) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setRows([]);
            setRemovedRows([]);

            const [{ data: accData }, { data: gData }] = await Promise.all([supabase.from("accounts").select("id, username").order("username"), supabase.from("games").select("id, name, requires_private_server").eq("eldorado_game_id", eldoradoGameId).maybeSingle()]);

            let linked = [];
            if (gData) {
                const { data: agData } = await supabase.from("account_games").select("id, account_id, private_server_link, accounts(username)").eq("game_id", gData.id);
                linked = (agData || [])
                    .map((ag) => ({
                        accountGameId: ag.id,
                        account_id: ag.account_id,
                        username: ag.accounts?.username || "(akun kehapus)",
                        link: ag.private_server_link || "",
                    }))
                    .sort((a, b) => a.username.localeCompare(b.username));
            }

            if (cancelled) return;
            setAllAccounts(accData || []);
            setGameRow(gData || null);
            setRows(linked);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [open, eldoradoGameId]);

    const availableAccounts = allAccounts.filter((acc) => !rows.some((r) => r.account_id === acc.id));

    const handleAddAccount = (account) => {
        setRows((prev) => [...prev, { accountGameId: null, account_id: account.id, username: account.username, link: "" }]);
    };

    // Akunnya belum kedaftar di /accounts — daftarin langsung dari sini terus tautin.
    const handleCreateAccount = async (username) => {
        const { data } = await createAccountFromCombo(username.trim());
        if (!data) return;
        setAllAccounts((prev) => [...prev, data].sort((a, b) => a.username.localeCompare(b.username)));
        handleAddAccount(data);
    };

    const handleChangeLink = (accountId, link) => {
        setRows((prev) => prev.map((r) => (r.account_id === accountId ? { ...r, link } : r)));
    };

    const handleRemoveRow = (accountId) => {
        const row = rows.find((r) => r.account_id === accountId);
        if (row?.accountGameId) setRemovedRows((prev) => [...prev, row]);
        setRows((prev) => prev.filter((r) => r.account_id !== accountId));
    };

    // Link private server unique di DB, jadi cegah duplikat dari dialog sebelum kena error unique.
    const findDuplicateLink = () => {
        const seen = new Set();
        for (const row of rows) {
            const link = row.link.trim();
            if (!link) continue;
            if (seen.has(link)) return link;
            seen.add(link);
        }
        return null;
    };

    const handleSave = async () => {
        if (findDuplicateLink()) return toast.error("Ada link kembar!", { description: "Satu link private server cuma boleh dipake satu akun bro." });

        setSaving(true);
        try {
            let targetGameId = gameRow?.id;

            // Baris games lokal belum ada -> bikin dari data library.
            if (!targetGameId) {
                const { data: inserted, error } = await supabase
                    .from("games")
                    .insert([{ name: gameName, image_url: eldoradoIconUrl(eldoradoGameId), eldorado_game_id: eldoradoGameId, requires_private_server: false }])
                    .select("id, name, requires_private_server")
                    .single();
                if (error) {
                    toast.error("Gagal nyimpen game", { description: error.message });
                    return;
                }
                targetGameId = inserted.id;
                setGameRow(inserted);
            }

            const failed = [];

            // Cabut akun yang dihapus, ikut bersihin stok itemnya di game ini.
            if (removedRows.length > 0) {
                const { error: delErr } = await supabase
                    .from("account_games")
                    .delete()
                    .in(
                        "id",
                        removedRows.map((r) => r.accountGameId)
                    );
                if (delErr) {
                    failed.push(`hapus akun: ${delErr.message}`);
                } else {
                    const { data: gameItems } = await supabase.from("items").select("id").eq("game_id", targetGameId);
                    if (gameItems?.length > 0)
                        await supabase
                            .from("account_items")
                            .delete()
                            .in(
                                "account_id",
                                removedRows.map((r) => r.account_id)
                            )
                            .in(
                                "item_id",
                                gameItems.map((i) => i.id)
                            );
                }
            }

            for (const row of rows) {
                const link = row.link.trim() || null;
                const { error } = row.accountGameId ? await supabase.from("account_games").update({ private_server_link: link }).eq("id", row.accountGameId) : await supabase.from("account_games").insert([{ game_id: targetGameId, account_id: row.account_id, private_server_link: link }]);
                if (error) failed.push(`${row.username}: ${isDuplicateError(error) ? "link udah dipake di tempat lain" : error.message}`);
            }

            if (failed.length > 0) {
                toast.error("Sebagian gagal disimpen", { description: failed.join(" | ") });
            } else {
                toast.success("Mantap!", { description: `Link private server ${gameName} udah keupdate.` });
                onOpenChange(false);
            }
            onSaved?.();
        } finally {
            setSaving(false);
        }
    };

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Private Server Link" titleClassName="text-glow-primary" maxWidth="sm:max-w-2xl">
            <div className="space-y-4 pt-2">
                <div className="border-border bg-surface-2/50 flex items-center gap-3 rounded-lg border p-3">
                    <div className="border-border/50 bg-surface-3 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">{eldoradoGameId && <img src={eldoradoIconUrl(eldoradoGameId)} alt={gameName} className="h-full w-full object-cover" />}</div>
                    <div className="min-w-0">
                        <p className="text-foreground truncate font-bold">{gameName}</p>
                        <p className="text-muted-foreground font-mono text-xs">ID: {eldoradoGameId}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ngambil data akun...
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Tambah akun</Label>
                            <ComboboxSelect items={availableAccounts} value="" onSelect={handleAddAccount} getItemValue={(acc) => acc.username} placeholder={availableAccounts.length > 0 ? "-- Pilih akun --" : "Semua akun udah ditautin"} searchPlaceholder="Cari atau ketik akun baru..." emptyText="Gak ada akun yang cocok." onCreateNew={handleCreateAccount} createNewLabel={(term) => `Daftarin "${term}"`} />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Akun di game ini ({rows.length})</Label>
                            {rows.length > 0 ? (
                                <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                                    {rows.map((row) => (
                                        <div key={row.account_id} className="border-border bg-surface-2/40 flex items-center gap-2 rounded-lg border p-2">
                                            <span className="text-foreground w-28 shrink-0 truncate text-sm font-medium" title={row.username}>
                                                {row.username}
                                            </span>
                                            <Input placeholder="https://www.roblox.com/share?code=..." value={row.link} onChange={(e) => handleChangeLink(row.account_id, e.target.value)} className="border-border bg-surface-1 text-xs" />
                                            <ActionIcon icon={Trash2} variant="delete" title="Cabut akun dari game ini" onClick={() => handleRemoveRow(row.account_id)} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="border-border bg-surface-2/30 text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">Belum ada akun buat game ini.</p>
                            )}
                        </div>

                        <Button type="button" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 w-full font-bold text-black">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                        </Button>
                    </>
                )}
            </div>
        </FormDialog>
    );
}
