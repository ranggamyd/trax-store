"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign, Pencil, Plus, Trash2, User } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { ActionIcon } from "@/components/atoms/ActionIcon";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SearchBar } from "@/components/molecules/SearchBar";
import { DataTable } from "@/components/organisms/DataTable";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { accountSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editAccountId, setEditAccountId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(accountSchema),
    });

    useAuthGuard(() => fetchAccounts());

    const fetchAccounts = async () => {
        setLoading(true);
        const { data } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
        setAccounts(data || []);
        setLoading(false);
    };

    const onSubmit = async (data) => {
        const status = data.is_empty_robux ? "ACTIVE" : "EMPTY_ROBUX";

        const { data: existingAccount } = await supabase.from("accounts").select("id").eq("username", data.username).single();

        if (existingAccount && existingAccount.id !== editAccountId) {
            toast.error("Gagal!", { description: "Akun udah ada" });
            return;
        }

        if (editAccountId) {
            const { error } = await supabase.from("accounts").update({ username: data.username, notes: data.notes, status }).eq("id", editAccountId);

            if (error) {
                toast.error("Gagal!", { description: error.message });
            } else {
                closeDialog();
                fetchAccounts();
            }
        } else {
            const { error } = await supabase.from("accounts").insert([{ username: data.username, notes: data.notes, status }]);

            if (error) {
                toast.error("Gagal!", { description: error.message });
            } else {
                closeDialog();
                fetchAccounts();
            }
        }
    };

    const closeDialog = () => {
        setIsAddOpen(false);
        setEditAccountId(null);
        reset({ username: "", notes: "", is_empty_robux: false });
    };

    const handleDelete = async (id) => {
        await supabase.from("accounts").delete().eq("id", id);
        fetchAccounts();
    };

    const toggleStatus = async (acc) => {
        const newStatus = acc.status === "EMPTY_ROBUX" ? "ACTIVE" : "EMPTY_ROBUX";
        await supabase.from("accounts").update({ status: newStatus }).eq("id", acc.id);

        fetchAccounts();
    };

    const filteredAccounts = accounts.filter((acc) => acc.username.toLowerCase().includes(searchQuery.toLowerCase()) || (acc.notes && acc.notes.toLowerCase().includes(searchQuery.toLowerCase())));

    return (
        <PageContainer>
            <PageHeader
                title="Akun Roblox"
                subtitle="Disimpen di DB internal"
                icon={User}
                color="accent"
                rightContent={
                    <div className="flex w-full flex-col items-center gap-4 md:flex-row">
                        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Username..." containerClassName="w-full md:w-64" />
                        <Button
                            className="bg-accent hover:bg-accent/80 w-full font-bold text-black md:w-auto"
                            onClick={() => {
                                setEditAccountId(null);
                                reset({ username: "", notes: "", is_empty_robux: false });
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                    </div>
                }
            />

            <FormDialog open={isAddOpen} onOpenChange={(open) => (open ? setIsAddOpen(true) : closeDialog())} title={editAccountId ? "Edit" : "Tambah"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField label="Username" id="username" error={errors.username?.message} register={register("username")} />
                    <FormField label="Notes" id="notes" register={register("notes")} />
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="checkbox" id="is_empty_robux" {...register("is_empty_robux")} className="text-accent focus:ring-accent h-4 w-4 rounded border-zinc-700 bg-zinc-900 focus:ring-offset-zinc-950" />
                        <label htmlFor="is_empty_robux" className="text-sm font-medium text-zinc-300">
                            Akun Robux?
                        </label>
                    </div>
                    <Button type="submit" className="bg-accent hover:bg-accent/80 mt-4 w-full font-bold text-black">
                        {editAccountId ? "Edit" : "Tambah"}
                    </Button>
                </form>
            </FormDialog>

            <div className="w-full">
                <DataTable
                    loading={loading}
                    data={filteredAccounts}
                    emptyMessage="Kosong"
                    columns={[{ label: "Username" }, { label: "Notes" }, { label: "Robux", className: "text-center" }, { label: "Aksi", className: "text-right" }]}
                    renderRow={(acc) => (
                        <TableRow key={acc.id} className="cursor-pointer border-zinc-800 hover:bg-zinc-900/50">
                            <TableCell className="flex items-center gap-3 font-medium">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner">{getInitials(acc.username)}</div>
                                <div className="flex items-center gap-2">
                                    {acc.username} <CopyButton textToCopy={acc.username} className="h-6 w-6" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="inline-block max-w-xs truncate text-zinc-400">{acc.notes || "-"}</span>
                            </TableCell>
                            <TableCell className="text-center">{acc.status === "EMPTY_ROBUX" ? <StatusBadge variant="danger">Habis</StatusBadge> : <StatusBadge variant="success">Tersedia</StatusBadge>}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <ActionIcon icon={CircleDollarSign} title={acc.status === "EMPTY_ROBUX" ? "Tandai Tersedia" : "Tandai Habis"} variant={acc.status === "EMPTY_ROBUX" ? "success" : "warning"} onClick={() => toggleStatus(acc)} />
                                    <ActionIcon
                                        icon={Pencil}
                                        title="Edit"
                                        variant="edit"
                                        onClick={() => {
                                            setEditAccountId(acc.id);
                                            reset({ username: acc.username, notes: acc.notes || "", is_empty_robux: acc.status === "ACTIVE" });
                                            setIsAddOpen(true);
                                        }}
                                    />
                                    <ActionIcon icon={Trash2} title="Hapus Akun" variant="delete" onClick={() => handleDelete(acc.id)} />
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </div>
        </PageContainer>
    );
}
