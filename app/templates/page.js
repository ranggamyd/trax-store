"use client";

import { Gamepad2, Link2, Loader2Icon, MessageSquare, Minus, Pencil, Plus, Trash2, TriangleAlert, UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { templateSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import { attachLibraryInfo, buildTemplateVars, fetchGamesWithAccounts, selectableGames, TEMPLATE_PLACEHOLDERS } from "@/lib/templateVars";

const AVAILABLE_TRIGGERS = ["initialized", "paid", "delivered", "received", "completed", "canceled"];

const SPECIFIC_EXAMPLE_TEXT = "Please join this private server so I can deliver your order:\n{{private_server_link}}\n\nI'll be waiting in-game as {{account_username}}. Let me know once you're in! 🙏";

export default function TemplatesPage() {
    const { library } = useEldoradoLibrary();
    const [templates, setTemplates] = useState([]);
    const [linkedGames, setLinkedGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const textareaRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        type: "General",
        text: "",
        triggers: [],
        sort_order: 0,
        game_id: null,
        account_id: null,
    });

    const fetchTemplates = async () => {
        setLoading(true);
        const [{ data }, gamesData] = await Promise.all([supabase.from("chat_templates").select("*").order("sort_order", { ascending: true }), fetchGamesWithAccounts()]);

        setTemplates(data || []);
        setLinkedGames(gamesData);
        setLoading(false);
    };

    useAuthGuard(() => fetchTemplates());

    // Nama + icon game dateng dari Eldorado library; baris `games` cuma penghubung ke akun.
    const games = useMemo(() => attachLibraryInfo(linkedGames, library), [linkedGames, library]);
    const gameOptions = useMemo(() => selectableGames(games), [games]);

    const selectedGame = games.find((g) => g.id === formData.game_id) || null;
    const selectedAccount = selectedGame?.accounts.find((a) => a.account_id === formData.account_id) || null;
    const previewVars = buildTemplateVars(selectedGame, selectedAccount);

    const findGame = (gameId) => games.find((g) => g.id === gameId) || null;
    const findAccount = (gameId, accountId) => findGame(gameId)?.accounts.find((a) => a.account_id === accountId) || null;

    const openAddModal = () => {
        setSelectedTemplate(null);
        setFormData({ title: "", type: "General", text: "", triggers: [], sort_order: 0, game_id: null, account_id: null });
        setIsDialogOpen(true);
    };

    const openEditModal = (tmpl) => {
        setSelectedTemplate(tmpl);
        setFormData({
            title: tmpl.title,
            type: tmpl.type,
            text: tmpl.text,
            triggers: tmpl.triggers || [],
            sort_order: tmpl.sort_order || 0,
            game_id: tmpl.game_id || null,
            account_id: tmpl.account_id || null,
        });
        setIsDialogOpen(true);
    };

    const handleToggleTrigger = (trigger) => {
        setFormData((prev) => {
            if (prev.triggers.includes(trigger)) {
                return { ...prev, triggers: prev.triggers.filter((t) => t !== trigger) };
            } else {
                return { ...prev, triggers: [...prev.triggers, trigger] };
            }
        });
    };

    const handleSelectType = (type) => {
        // Relasi game/akun cuma relevan buat Specific.
        setFormData((prev) => (type === "Specific" ? { ...prev, type } : { ...prev, type, game_id: null, account_id: null }));
    };

    const handleSelectGame = (game) => {
        // Kalo game-nya cuma nempel di satu akun, langsung jadiin default biar gak usah milih lagi.
        const onlyAccount = game.accounts.length === 1 ? game.accounts[0].account_id : null;
        setFormData((prev) => ({ ...prev, game_id: game.id, account_id: onlyAccount }));
    };

    const insertPlaceholder = (token) => {
        const el = textareaRef.current;
        if (!el) {
            setFormData((prev) => ({ ...prev, text: `${prev.text}${token}` }));
            return;
        }
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        const nextText = `${el.value.slice(0, start)}${token}${el.value.slice(end)}`;
        setFormData((prev) => ({ ...prev, text: nextText }));
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const handleSave = async () => {
        const result = templateSchema.safeParse(formData);

        if (!result.success) {
            toast.error(result.error.issues[0]?.message || "Data template belum bener bro!");
            return;
        }

        const payload = result.data;

        if (selectedTemplate) {
            const { error } = await supabase.from("chat_templates").update(payload).eq("id", selectedTemplate.id);
            if (error) return toast.error("Gagal update template", { description: error.message });
        } else {
            const { error } = await supabase.from("chat_templates").insert(payload);
            if (error) return toast.error("Gagal nambah template", { description: error.message });
        }

        setIsDialogOpen(false);
        fetchTemplates();
    };

    const handleDelete = async (id) => {
        await supabase.from("chat_templates").delete().eq("id", id);

        fetchTemplates();
    };

    return (
        <PageContainer>
            <PageHeader
                icon={MessageSquare}
                title="Templates"
                subtitle="Buat balesin orderan"
                rightContent={
                    <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="mr-2 h-4 w-4" /> Tambah
                    </Button>
                }
            />

            <div className="mt-8">
                {loading ? (
                    <div className="flex justify-center p-12 text-zinc-500">
                        <Loader2Icon className="h-8 w-8 animate-spin" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center text-zinc-500">Kosong</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {templates.map((tmpl) => {
                            const tmplGame = findGame(tmpl.game_id);
                            const tmplAccount = findAccount(tmpl.game_id, tmpl.account_id);

                            return (
                                <div key={tmpl.id} className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-lg font-bold text-white">{tmpl.title}</span>
                                            <span className="font-mono text-[10px] text-zinc-500">Urutan: #{tmpl.sort_order || 0}</span>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tmpl.type === "General" ? "border border-blue-900/50 bg-blue-900/30 text-blue-400" : "border border-purple-900/50 bg-purple-900/30 text-purple-400"}`}>{tmpl.type}</span>
                                    </div>

                                    {tmpl.type === "Specific" && (
                                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 rounded border border-purple-900/50 bg-purple-950/40 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                                                {tmplGame?.icon_url ? <img src={tmplGame.icon_url} alt={tmplGame.name} className="h-3 w-3 rounded-sm object-cover" /> : <Gamepad2 className="h-3 w-3" />}
                                                {tmplGame?.name || "Game kehapus"}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-300">
                                                <UserRound className="h-3 w-3" />
                                                {tmplAccount?.username || "Akun dipilih saat kirim"}
                                            </span>
                                            {tmplAccount && !tmplAccount.private_server_link && (
                                                <span className="inline-flex items-center gap-1 rounded border border-yellow-900/50 bg-yellow-950/40 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
                                                    <TriangleAlert className="h-3 w-3" />
                                                    Link kosong
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <p className="mb-4 flex-1 text-sm whitespace-pre-line text-zinc-400 italic">"{tmpl.text}"</p>

                                    <div className="flex items-end justify-between border-t border-zinc-800/80 pt-4">
                                        <div className="flex flex-1 flex-col gap-1.5 pr-2">
                                            <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Triggers:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {tmpl.triggers && tmpl.triggers.length > 0 ? (
                                                    tmpl.triggers.map((t) => (
                                                        <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                                                            {t}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-zinc-600 italic">No triggers</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <ActionIcon icon={Pencil} onClick={() => openEditModal(tmpl)} className="hover:text-blue-400" />
                                            <ConfirmDialog trigger={<ActionIcon icon={Trash2} className="hover:text-red-400" />} title="Hapus Template" description={`Yakin mau hapus template "${tmpl.title}"?`} onConfirm={() => handleDelete(tmpl.id)} confirmText="Hapus" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto border border-zinc-800 bg-zinc-950 text-white sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>{selectedTemplate ? "Edit Template" : "Tambah Template"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm text-zinc-400">Judul</label>
                            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="col-span-3 border-zinc-700 bg-zinc-900" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm text-zinc-400">Urutan</label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white" onClick={() => setFormData({ ...formData, sort_order: Math.max(0, formData.sort_order - 1) })}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-16 [appearance:textfield] border-zinc-700 bg-zinc-900 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" placeholder="0" />
                                <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white" onClick={() => setFormData({ ...formData, sort_order: formData.sort_order + 1 })}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm text-zinc-400">Tipe</label>
                            <div className="col-span-3 flex gap-2">
                                <Button variant={formData.type === "General" ? "default" : "outline"} onClick={() => handleSelectType("General")} className={formData.type === "General" ? "bg-blue-600 hover:bg-blue-700" : "border-zinc-700 hover:bg-zinc-800"}>
                                    General
                                </Button>
                                <Button variant={formData.type === "Specific" ? "default" : "outline"} onClick={() => handleSelectType("Specific")} className={formData.type === "Specific" ? "bg-purple-600 hover:bg-purple-700" : "border-zinc-700 hover:bg-zinc-800"}>
                                    Specific
                                </Button>
                            </div>
                        </div>

                        {formData.type === "Specific" && (
                            <div className="flex flex-col gap-4 rounded-xl border border-purple-900/40 bg-purple-950/10 p-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm text-zinc-400">Game</label>
                                    <div className="col-span-3">
                                        <ComboboxSelect
                                            items={gameOptions}
                                            value={formData.game_id || ""}
                                            onSelect={handleSelectGame}
                                            getItemValue={(g) => g.name}
                                            renderItem={(g) => (
                                                <span className="flex w-full items-center gap-2">
                                                    {g.icon_url && <img src={g.icon_url} alt={g.name} className="h-5 w-5 shrink-0 rounded object-cover" />}
                                                    <span className="flex-1 truncate">{g.name}</span>
                                                    <span className="shrink-0 text-[10px] text-zinc-500">{g.accounts.length} akun</span>
                                                </span>
                                            )}
                                            placeholder="-- Pilih game --"
                                            searchPlaceholder="Cari game..."
                                            emptyText="Belum ada game Eldorado yang punya akun. Tautin dulu di /games."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm text-zinc-400">Akun default</label>
                                    <div className="col-span-3">
                                        <ComboboxSelect
                                            items={selectedGame?.accounts || []}
                                            value={formData.account_id || ""}
                                            onSelect={(acc) => setFormData({ ...formData, account_id: acc.account_id })}
                                            getItemId={(acc) => acc.account_id}
                                            getItemValue={(acc) => acc.username}
                                            renderItem={(acc) => (
                                                <span className="flex w-full items-center justify-between gap-2">
                                                    <span className="truncate">{acc.username}</span>
                                                    {!acc.private_server_link && <span className="shrink-0 text-[10px] text-yellow-600">link kosong</span>}
                                                </span>
                                            )}
                                            placeholder={selectedGame ? "-- Pilih akun --" : "Pilih game dulu"}
                                            searchPlaceholder="Cari akun..."
                                            emptyText="Game ini belum ada akunnya."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-start gap-4">
                                    <label className="pt-1.5 text-right text-sm text-zinc-400">Link</label>
                                    <div className="col-span-3 min-w-0">
                                        {previewVars.private_server_link ? (
                                            <p className="flex items-start gap-1.5 text-xs break-all text-zinc-300">
                                                <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                {previewVars.private_server_link}
                                            </p>
                                        ) : (
                                            <p className="flex items-start gap-1.5 text-xs text-zinc-500 italic">
                                                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-600" />
                                                {selectedAccount ? "Akun ini belum ada link private server-nya. Isi dulu di halaman /games." : "Link keisi otomatis pas akunnya dipilih (atau dipilih pas mau kirim di chat)."}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-start gap-4">
                            <label className="pt-2 text-right text-sm text-zinc-400">Text</label>
                            <div className="col-span-3 flex flex-col gap-2">
                                <Textarea ref={textareaRef} value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} className="min-h-[100px] border-zinc-700 bg-zinc-900" />
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {TEMPLATE_PLACEHOLDERS.map((ph) => (
                                        <Button key={ph.key} type="button" size="sm" variant="outline" onClick={() => insertPlaceholder(ph.token)} className="h-6 border-zinc-700 px-1.5 font-mono text-[10px] text-zinc-400 hover:text-white" title={`Sisipin ${ph.label}`}>
                                            {ph.token}
                                        </Button>
                                    ))}
                                    {formData.type === "Specific" && !formData.text.trim() && (
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setFormData({ ...formData, text: SPECIFIC_EXAMPLE_TEXT })} className="h-6 px-1.5 text-[10px] text-purple-400 hover:text-purple-300">
                                            Pake contoh teks
                                        </Button>
                                    )}
                                </div>
                                {formData.type === "Specific" && !formData.text.includes("{{private_server_link}}") && <p className="text-[11px] text-yellow-600">Teksnya belum ada {"{{private_server_link}}"} — nanti link-nya gak nongol di chat.</p>}
                                {formData.type === "Specific" && formData.text.includes("{{private_server_link}}") && previewVars.private_server_link && <p className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-[11px] whitespace-pre-line text-zinc-400">{formData.text.replaceAll("{{private_server_link}}", previewVars.private_server_link).replaceAll("{{game_name}}", previewVars.game_name).replaceAll("{{account_username}}", previewVars.account_username)}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <label className="pt-2 text-right text-sm text-zinc-400">Triggers</label>
                            <div className="col-span-3 flex flex-wrap gap-2">
                                {AVAILABLE_TRIGGERS.map((trigger) => (
                                    <Button key={trigger} size="sm" variant={formData.triggers.includes(trigger) ? "default" : "outline"} onClick={() => handleToggleTrigger(trigger)} className={`h-7 text-xs ${formData.triggers.includes(trigger) ? "bg-primary text-primary-foreground" : "border-zinc-700 text-zinc-400 hover:text-white"}`}>
                                        {trigger}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700">
                            Batal
                        </Button>
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            {selectedTemplate ? "Edit" : "Tambah"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
