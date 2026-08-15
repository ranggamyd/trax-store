"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/lib/schemas";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { GlobalLoading } from "@/components/GlobalLoading";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { DataTable } from "@/components/organisms/DataTable";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { SearchBar } from "@/components/molecules/SearchBar";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { CopyButton } from "@/components/CopyButton";
import { getInitials } from "@/lib/utils";
import { Plus, Pencil, Trash2, CircleDollarSign, User, Eye } from "lucide-react";

export default function AccountsPage() {
    const router = useRouter();
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

    const { session } = useAuthGuard(() => fetchAccounts());

    const fetchAccounts = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });

        if (error) {
            toast.error("Gagal narik data akun", { description: error.message });
        } else {
            setAccounts(data || []);
        }
        setLoading(false);
    };

    const onSubmit = async (data) => {
        if (editAccountId) {
            const { error } = await supabase.from("accounts").update({ username: data.username, notes: data.notes }).eq("id", editAccountId);

            if (error) {
                toast.error("Waduh, gagal update akun", { description: error.message });
            } else {
                toast.success("Akun diupdate!", { description: "Data akun udah diubah." });
                closeDialog();
                fetchAccounts();
            }
        } else {
            const { error } = await supabase.from("accounts").insert([{ username: data.username, notes: data.notes }]);

            if (error) {
                toast.error("Waduh, gagal nambah akun", { description: error.message });
            } else {
                toast.success("Akun didaftarkan!", { description: "Akun baru udah masuk ke database." });
                closeDialog();
                fetchAccounts();
            }
        }
    };

    const closeDialog = () => {
        setIsAddOpen(false);
        setEditAccountId(null);
        reset({ username: "", notes: "" });
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) {
            toast.error("Gagal hapus bro", { description: error.message });
        } else {
            toast.success("Dibuang!", { description: "Akun udah lenyap." });
            fetchAccounts();
        }
    };

    const toggleStatus = async (acc) => {
        const newStatus = acc.status === "EMPTY_ROBUX" ? "ACTIVE" : "EMPTY_ROBUX";
        const { error } = await supabase.from("accounts").update({ status: newStatus }).eq("id", acc.id);

        if (error) {
            toast.error("Gagal ganti status", { description: error.message });
        } else {
            toast.success("Status diubah!", {
                description: `Akun sekarang ditandai ${newStatus === "EMPTY_ROBUX" ? "Habis Robux" : "Aktif"}.`,
            });
            fetchAccounts();
        }
    };

    const filteredAccounts = accounts.filter((acc) => acc.username.toLowerCase().includes(searchQuery.toLowerCase()) || (acc.notes && acc.notes.toLowerCase().includes(searchQuery.toLowerCase())));

    if (loading && !accounts.length) return <GlobalLoading text="Loading data akun..." />;
    if (!session) return <GlobalLoading text="Mengecek sesi..." />;

    return (
        <PageContainer>
            <PageHeader
                title="Daftar Akun Game"
                subtitle="List semua akun yang disetor buat jualan."
                icon={User}
                color="accent"
                rightContent={
                    <div className="flex w-full flex-col items-center gap-4 md:flex-row">
                        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari akun..." containerClassName="w-full md:w-64" />
                        <Button
                            className="bg-accent hover:bg-accent/80 w-full font-bold text-black md:w-auto"
                            onClick={() => {
                                setEditAccountId(null);
                                reset({ username: "", notes: "" });
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Daftarin Akun
                        </Button>
                    </div>
                }
            />

            <FormDialog open={isAddOpen} onOpenChange={(open) => (open ? setIsAddOpen(true) : closeDialog())} title={editAccountId ? "Edit Akun" : "Daftar Akun Baru"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField label="Username / Email Akun" id="username" error={errors.username?.message} register={register("username")} placeholder="Cth: player_sakti123" />
                    <FormField label="Catatan Tambahan (Opsional)" id="notes" register={register("notes")} placeholder="Cth: Akun tumbal" />
                    <Button type="submit" className="bg-accent hover:bg-accent/80 mt-4 w-full font-bold text-black">
                        Gass Simpan
                    </Button>
                </form>
            </FormDialog>

            <div className="w-full">
                <DataTable
                    loading={loading}
                    data={filteredAccounts}
                    emptyMessage="Belum ada akun yang terdaftar bro."
                    columns={[{ label: "Nama Akun" }, { label: "Catatan" }, { label: "Status", className: "text-center" }, { label: "Aksi", className: "text-right" }]}
                    renderRow={(acc) => (
                        <ClickableTableRow key={acc.id} href={`/accounts/${acc.id}`}>
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
                                    <Link href={`/accounts/${acc.id}`}>
                                        <ActionIcon icon={Eye} title="Detail Akun" />
                                    </Link>
                                    <ActionIcon
                                        icon={Pencil}
                                        title="Edit Akun"
                                        variant="edit"
                                        onClick={() => {
                                            setEditAccountId(acc.id);
                                            reset({ username: acc.username, notes: acc.notes || "" });
                                            setIsAddOpen(true);
                                        }}
                                    />
                                    <ConfirmDialog trigger={<ActionIcon icon={Trash2} title="Hapus Akun" variant="delete" />} title="Yakin lu mau hapus akun ini?" description="Data dan semua yang terhubung ke akun ini bakal ilang." onConfirm={() => handleDelete(acc.id)} confirmText="Hapus!" cancelText="Gak Jadi" />
                                </div>
                            </TableCell>
                        </ClickableTableRow>
                    )}
                />
            </div>
        </PageContainer>
    );
}
