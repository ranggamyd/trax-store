"use client";

import { Link2, Loader2, Minus, Plus, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { createTemplate, updateTemplate } from "@/app/templates/actions";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildTemplateVars, resolveTemplateText, selectableGames, TEMPLATE_PLACEHOLDERS } from "@/lib/templateVars";
import { cn } from "@/lib/utils";

export const AVAILABLE_TRIGGERS = ["initialized", "paid", "delivered", "received", "completed", "canceled"];

const SPECIFIC_EXAMPLE_TEXT = "Please join this private server so I can deliver your order:\n{{private_server_link}}\n\nI'll be waiting in-game as {{account_username}}. Let me know once you're in! 🙏";

const LINK_TOKEN = "{{private_server_link}}";

const EMPTY = { title: "", type: "General", text: "", triggers: [], sort_order: 0, game_id: null, account_id: null };

function initialForm(template) {
    if (!template) return EMPTY;
    return {
        title: template.title ?? "",
        type: template.type ?? "General",
        text: template.text ?? "",
        triggers: template.triggers ?? [],
        sort_order: template.sort_order ?? 0,
        game_id: template.game_id ?? null,
        account_id: template.account_id ?? null,
    };
}

function TemplateForm({ template, games, onClose }) {
    const isEdit = Boolean(template);

    const [form, setForm] = useState(() => initialForm(template));
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef(null);

    const gameOptions = selectableGames(games);
    const selectedGame = games.find((g) => g.id === form.game_id) ?? null;
    const selectedAccount = selectedGame?.accounts.find((a) => a.account_id === form.account_id) ?? null;
    const previewVars = buildTemplateVars(selectedGame, selectedAccount);

    const isSpecific = form.type === "Specific";
    const hasLinkToken = form.text.includes(LINK_TOKEN);

    const patch = (changes) => setForm((prev) => ({ ...prev, ...changes }));

    const selectType = (type) => {
        // Relasi game/akun cuma relevan buat Specific. Dikosongin di sini biar
        // apa yang kelihatan di form sama dengan apa yang bakal disimpen —
        // server juga ngosongin lewat transform di templateSchema.
        patch(type === "Specific" ? { type } : { type, game_id: null, account_id: null });
    };

    const selectGame = (game) => {
        // Kalau game-nya cuma nempel di satu akun, langsung jadiin default.
        const onlyAccount = game.accounts.length === 1 ? game.accounts[0].account_id : null;
        patch({ game_id: game.id, account_id: onlyAccount });
    };

    const toggleTrigger = (trigger) => {
        setForm((prev) => ({
            ...prev,
            triggers: prev.triggers.includes(trigger) ? prev.triggers.filter((t) => t !== trigger) : [...prev.triggers, trigger],
        }));
    };

    const insertPlaceholder = (token) => {
        const el = textareaRef.current;
        if (!el) {
            patch({ text: `${form.text}${token}` });
            return;
        }

        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        patch({ text: `${el.value.slice(0, start)}${token}${el.value.slice(end)}` });

        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const result = isEdit ? await updateTemplate(template.id, form) : await createTemplate(form);

        setIsSaving(false);

        if (result?.error) {
            toast.error(isEdit ? "Gagal nyimpen template" : "Gagal nambah template", { description: result.error });
            return;
        }

        toast.success(isEdit ? "Template kesimpen" : `Template "${form.title}" kebikin`);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Judul" id="title" required>
                <Input id="title" value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="misal: Sapaan awal" required className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            <FormField label="Urutan tampil" id="sort_order" hint="Angka kecil muncul lebih dulu di daftar chat.">
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" aria-label="Kurangi urutan" className="h-9 w-9 shrink-0" onClick={() => patch({ sort_order: Math.max(0, form.sort_order - 1) })}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Input id="sort_order" type="number" min={0} value={form.sort_order} onChange={(e) => patch({ sort_order: Number.parseInt(e.target.value, 10) || 0 })} className="border-border bg-input/60 h-9 w-16 [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    <Button type="button" variant="outline" size="icon" aria-label="Tambah urutan" className="h-9 w-9 shrink-0" onClick={() => patch({ sort_order: form.sort_order + 1 })}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </FormField>

            {/* Tipe: dua tombol jadi satu segmented control. Dulu dua tombol lepas
                dengan warna biru & ungu sendiri — dua aksen tambahan yang gak
                nyambung ke sistem warna mana pun. */}
            <div className="space-y-2">
                <Label>Tipe template</Label>
                <div className="border-border bg-surface-1/60 grid grid-cols-2 gap-1 rounded-xl border p-1">
                    {["General", "Specific"].map((type) => (
                        <button key={type} type="button" onClick={() => selectType(type)} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", form.type === type ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                            {type}
                        </button>
                    ))}
                </div>
                <p className="text-muted-foreground text-xs">{isSpecific ? "Nempel ke satu game — link private server-nya keisi otomatis." : "Bisa dipakai di semua order, tanpa link private server."}</p>
            </div>

            {isSpecific && (
                <div className="border-primary/25 bg-primary/[0.04] space-y-4 rounded-xl border p-3.5">
                    <FormField label="Game" id="game">
                        <ComboboxSelect
                            items={gameOptions}
                            value={form.game_id || ""}
                            onSelect={selectGame}
                            getItemValue={(g) => g.name}
                            renderItem={(g) => (
                                <span className="flex w-full items-center gap-2">
                                    {g.icon_url && <img src={g.icon_url} alt="" className="h-5 w-5 shrink-0 rounded object-cover" />}
                                    <span className="flex-1 truncate">{g.name}</span>
                                    <span className="text-muted-foreground shrink-0 text-[10px]">{g.accounts.length} akun</span>
                                </span>
                            )}
                            placeholder="-- Pilih game --"
                            searchPlaceholder="Cari game..."
                            emptyText="Belum ada game Eldorado yang punya akun. Tautin dulu di /games."
                        />
                    </FormField>

                    <FormField label="Akun default" id="account" hint={selectedGame ? undefined : "Pilih game-nya dulu."}>
                        <ComboboxSelect
                            items={selectedGame?.accounts ?? []}
                            value={form.account_id || ""}
                            onSelect={(acc) => patch({ account_id: acc.account_id })}
                            getItemId={(acc) => acc.account_id}
                            getItemValue={(acc) => acc.username}
                            disabled={!selectedGame}
                            renderItem={(acc) => (
                                <span className="flex w-full items-center justify-between gap-2">
                                    <span className="truncate">{acc.username}</span>
                                    {!acc.private_server_link && <span className="text-warning shrink-0 text-[10px]">link kosong</span>}
                                </span>
                            )}
                            placeholder={selectedGame ? "-- Pilih akun --" : "Pilih game dulu"}
                            searchPlaceholder="Cari akun..."
                            emptyText="Game ini belum ada akunnya."
                        />
                    </FormField>

                    <div className="space-y-1.5">
                        <Label>Link private server</Label>
                        {previewVars.private_server_link ? (
                            <p className="text-foreground/80 flex items-start gap-1.5 text-xs break-all">
                                <Link2 className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {previewVars.private_server_link}
                            </p>
                        ) : (
                            <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                                <TriangleAlert className="text-warning mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {selectedAccount ? "Akun ini belum ada link private server-nya. Isi dulu di /games." : "Link keisi otomatis pas akunnya dipilih — atau dipilih waktu mau kirim di chat."}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="text">
                    Isi pesan<span className="text-danger ml-0.5">*</span>
                </Label>
                <Textarea id="text" ref={textareaRef} value={form.text} onChange={(e) => patch({ text: e.target.value })} required className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 min-h-28" placeholder="Tulis pesannya di sini..." />

                <div className="flex flex-wrap items-center gap-1.5">
                    {TEMPLATE_PLACEHOLDERS.map((ph) => (
                        <Button key={ph.key} type="button" size="xs" variant="outline" onClick={() => insertPlaceholder(ph.token)} title={`Sisipin ${ph.label}`} className="font-mono text-[10px]">
                            {ph.token}
                        </Button>
                    ))}
                    {isSpecific && !form.text.trim() && (
                        <Button type="button" size="xs" variant="ghost" onClick={() => patch({ text: SPECIFIC_EXAMPLE_TEXT })} className="text-primary text-[10px]">
                            Pakai contoh
                        </Button>
                    )}
                </div>

                {isSpecific && !hasLinkToken && (
                    <p className="text-warning flex items-start gap-1.5 text-[11px]">
                        <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                        Teksnya belum ada {LINK_TOKEN} — nanti link-nya gak nongol di chat.
                    </p>
                )}

                {isSpecific && hasLinkToken && previewVars.private_server_link && (
                    <div className="border-border bg-surface-1/60 rounded-lg border p-2.5">
                        <p className="text-muted-foreground mb-1.5 text-[10px] font-bold tracking-wide uppercase">Pratinjau</p>
                        <p className="text-foreground/80 text-[11px] whitespace-pre-line">{resolveTemplateText(form.text, previewVars)}</p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Trigger</Label>
                <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TRIGGERS.map((trigger) => {
                        const active = form.triggers.includes(trigger);
                        return (
                            <button key={trigger} type="button" onClick={() => toggleTrigger(trigger)} className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors", active ? "border-primary/40 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                                {trigger}
                            </button>
                        );
                    })}
                </div>
                <p className="text-muted-foreground text-xs">Template bakal disaranin otomatis waktu order masuk ke status ini.</p>
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
                    ) : isEdit ? (
                        "Simpen perubahan"
                    ) : (
                        "Bikin template"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function TemplateFormDialog({ template = null, games = [], open, onOpenChange }) {
    const isEdit = Boolean(template);

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Edit template" : "Template baru"} description={isEdit ? `Ngubah "${template.title}".` : "Balesan siap pakai buat order yang masuk."} maxWidth="sm:max-w-xl" className="custom-scrollbar max-h-[90vh] overflow-y-auto">
            {open && <TemplateForm key={template?.id ?? "new"} template={template} games={games} onClose={() => onOpenChange(false)} />}
        </FormDialog>
    );
}
