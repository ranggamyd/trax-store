"use client";

import { Loader2Icon, MessageSquare, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { templateSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";

const AVAILABLE_TRIGGERS = ["initialized", "paid", "delivered", "received", "completed", "canceled"];

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        type: "General",
        text: "",
        triggers: [],
        sort_order: 0,
    });

    const fetchTemplates = async () => {
        setLoading(true);
        const { data } = await supabase.from("chat_templates").select("*").order("sort_order", { ascending: true });

        setTemplates(data || []);
        setLoading(false);
    };

    useAuthGuard(() => fetchTemplates());

    const openAddModal = () => {
        setSelectedTemplate(null);
        setFormData({ title: "", type: "General", text: "", triggers: [], sort_order: 0 });
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

    const handleSave = async () => {
        const result = templateSchema.safeParse(formData);

        if (!result.success) {
            toast.error(result.error.errors[0].message);
            return;
        }

        const payload = result.data;

        if (selectedTemplate) {
            await supabase.from("chat_templates").update(payload).eq("id", selectedTemplate.id);

            setIsDialogOpen(false);
            fetchTemplates();
        } else {
            await supabase.from("chat_templates").insert(payload);

            setIsDialogOpen(false);
            fetchTemplates();
        }
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
                        {templates.map((tmpl) => (
                            <div key={tmpl.id} className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-lg font-bold text-white">{tmpl.title}</span>
                                        <span className="font-mono text-[10px] text-zinc-500">Urutan: #{tmpl.sort_order || 0}</span>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tmpl.type === "General" ? "border border-blue-900/50 bg-blue-900/30 text-blue-400" : "border border-purple-900/50 bg-purple-900/30 text-purple-400"}`}>{tmpl.type}</span>
                                </div>
                                <p className="mb-4 flex-1 text-sm text-zinc-400 italic">"{tmpl.text}"</p>

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
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="border border-zinc-800 bg-zinc-950 text-white sm:max-w-[500px]">
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
                                <Button variant={formData.type === "General" ? "default" : "outline"} onClick={() => setFormData({ ...formData, type: "General" })} className={formData.type === "General" ? "bg-blue-600 hover:bg-blue-700" : "border-zinc-700 hover:bg-zinc-800"}>
                                    General
                                </Button>
                                <Button variant={formData.type === "Specific" ? "default" : "outline"} onClick={() => setFormData({ ...formData, type: "Specific" })} className={formData.type === "Specific" ? "bg-purple-600 hover:bg-purple-700" : "border-zinc-700 hover:bg-zinc-800"}>
                                    Specific
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <label className="pt-2 text-right text-sm text-zinc-400">Text</label>
                            <Textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} className="col-span-3 min-h-[100px] border-zinc-700 bg-zinc-900" />
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
