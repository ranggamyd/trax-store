"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { updateGame } from "@/app/games/[id]/actions";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Edit game — dengan alur "wajib isi link dulu" dua langkah.
 *
 * ALURNYA:
 *   1. Submit biasa -> updateGame().
 *   2. Kalau `requires_private_server` dinyalain padahal masih ada akun yang
 *      link-nya kosong, server BALIKIN `needsLinks` (bukan error) dan gak
 *      nyimpen apa pun.
 *   3. Dialog ganti isinya jadi daftar akun yang harus diisi.
 *   4. Submit lagi, sekarang bawa link yang udah keisi. Server nyimpen link-nya
 *      dulu, cek ULANG dari DB, baru nyimpen game-nya.
 *
 * Bedanya sama versi lama: dulu langkah 2 dan 4 dikerjain KLIEN — query akun
 * yang kosong, terus dua update terpisah. Artinya siapa pun yang nembak update
 * game langsung bisa nyalain `requires_private_server` sambil ninggalin akun
 * tanpa link. Sekarang server yang megang aturannya, dan dia gak bisa dilewati.
 */
function GameEditForm({ game, onClose }) {
    const [name, setName] = useState(game.name ?? "");
    const [imageUrl, setImageUrl] = useState(game.image_url ?? "");
    const [requiresPs, setRequiresPs] = useState(Boolean(game.requires_private_server));
    const [isSaving, setIsSaving] = useState(false);

    // null = langkah 1 (form biasa). Array = langkah 2 (isi link).
    const [needsLinks, setNeedsLinks] = useState(null);

    const submit = async (missingLinks) => {
        setIsSaving(true);
        const result = await updateGame({ gameId: game.id, name, imageUrl, requiresPrivateServer: requiresPs, missingLinks });
        setIsSaving(false);

        if (result?.needsLinks) {
            setNeedsLinks(result.needsLinks);
            toast.warning("Ada akun yang belum punya link", {
                description: `${result.needsLinks.length} akun harus diisi dulu sebelum game ini bisa diwajibin private server.`,
            });
            return;
        }

        if (result?.error) {
            toast.error("Gagal simpen game", { description: result.error });
            return;
        }

        toast.success("Data game kesimpen");
        onClose();
    };

    /* ── Langkah 2: isi link yang kosong ── */
    if (needsLinks) {
        const allFilled = needsLinks.every((row) => row.privateServerLink.trim());

        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(needsLinks);
                }}
                className="space-y-4 pt-1"
            >
                <div className="border-warning/25 bg-warning/[0.07] flex gap-3 rounded-xl border p-3.5">
                    <TriangleAlert className="text-warning mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Game ini mau diwajibin private server, tapi <strong className="text-foreground">{needsLinks.length} akun</strong> yang udah ketaut belum punya link. Isi semuanya dulu — kalau nggak, template chat bakal ngirim link kosong ke buyer.
                    </p>
                </div>

                <div className="custom-scrollbar max-h-64 space-y-3 overflow-y-auto pr-1">
                    {needsLinks.map((row, index) => (
                        <div key={row.accountGameId} className="space-y-1.5">
                            <Label htmlFor={`ml-${row.accountGameId}`} className="text-xs">
                                {row.username}
                            </Label>
                            <Input
                                id={`ml-${row.accountGameId}`}
                                placeholder="https://www.roblox.com/games/..."
                                value={row.privateServerLink}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setNeedsLinks((rows) => rows.map((r, i) => (i === index ? { ...r, privateServerLink: next } : r)));
                                }}
                                required
                                className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={() => setNeedsLinks(null)} disabled={isSaving}>
                        Balik
                    </Button>
                    <Button type="submit" className="font-semibold" disabled={isSaving || !allFilled}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Nyimpen...
                            </>
                        ) : (
                            "Simpen link + game"
                        )}
                    </Button>
                </div>
            </form>
        );
    }

    /* ── Langkah 1: form game ── */
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit(null);
            }}
            className="space-y-4 pt-1"
        >
            <FormField label="Nama game" id="game-name" required>
                <Input id="game-name" value={name} onChange={(e) => setName(e.target.value)} required className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            <FormField label="URL gambar" id="game-image" hint="Opsional. Dipakai sebagai ikon di daftar.">
                <Input id="game-image" type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            <div className="border-border bg-surface-1/50 flex items-start justify-between gap-4 rounded-xl border p-3.5">
                <div className="min-w-0">
                    <Label htmlFor="requires-ps" className="text-sm font-medium">
                        Wajib private server
                    </Label>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{requiresPs ? "Tiap akun yang ketaut ke game ini harus punya link." : "Akun boleh ketaut tanpa link private server."}</p>
                </div>
                <Switch id="requires-ps" checked={requiresPs} onCheckedChange={setRequiresPs} className="mt-0.5 shrink-0" />
            </div>

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
                        "Simpen perubahan"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function GameEditDialog({ game, open, onOpenChange }) {
    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Edit game" description={game.name} maxWidth="sm:max-w-md">
            {open && <GameEditForm key={game.id} game={game} onClose={() => onOpenChange(false)} />}
        </FormDialog>
    );
}
