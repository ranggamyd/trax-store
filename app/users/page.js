"use client";
import { Pencil, Plus, Shield, Trash2, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createUser, deleteUser, listUsers, updateUser } from "@/app/actions/users";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmailListInput } from "@/components/molecules/EmailListInput";
import { FormDialog } from "@/components/molecules/FormDialog";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { SearchBar } from "@/components/molecules/SearchBar";
import { DataTable } from "@/components/organisms/DataTable";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [username, setUsername] = useState("");
    const [emails, setEmails] = useState([""]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editUserId, setEditUserId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        const { users: data } = await listUsers();
        setUsers(data || []);
        setLoading(false);
    };

    const { session } = useAuthGuard(() => fetchUsers());

    const onSubmit = async (e) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            return toast.error("Password gak sama!");
        }

        setIsCreating(true);
        const emailList = emails.map((em) => em.trim()).filter((em) => em);

        if (editUserId) {
            const { error } = await updateUser(editUserId, { username, password, emails: emailList });
            if (error) {
                toast.error(error);
            } else {
                closeDialog();
                fetchUsers();
            }
        } else {
            const { error } = await createUser({ username, password, emails: emailList });
            if (error) {
                toast.error(error);
            } else {
                toast.success("Admin baru berhasil ditambahkan!");
                closeDialog();
                fetchUsers();
            }
        }
        setIsCreating(false);
    };

    const openEditDialog = (user) => {
        setEditUserId(user.id);
        setUsername(user.username);
        setEmails(user.emails && user.emails.length > 0 ? user.emails : [""]);
        setPassword("");
        setConfirmPassword("");
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditUserId(null);
        setUsername("");
        setEmails([""]);
        setPassword("");
        setConfirmPassword("");
    };

    const handleDeleteUser = async (id) => {
        if (id === session?.user?.id) {
            return toast.error("Ngapain ngapus diri sendiri?");
        }

        await deleteUser(id);
        fetchUsers();
    };

    const filteredUsers = users.filter((user) => user.username?.toLowerCase().includes(search.toLowerCase()) || user.primary_email?.toLowerCase().includes(search.toLowerCase()));

    return (
        <PageContainer>
            <PageHeader
                title="Users"
                subtitle="Anggota geng"
                icon={Shield}
                rightContent={
                    <div className="flex w-full items-center gap-2 md:w-auto">
                        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Username/Email..." containerClassName="w-full md:w-64" />
                        <Button
                            className="bg-accent hover:bg-accent/80 w-full font-bold text-black md:w-auto"
                            onClick={() => {
                                closeDialog();
                                setIsDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                    </div>
                }
            />

            <FormDialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())} title={editUserId ? "Edit" : "Tambah"} titleClassName="text-2xl font-bold text-accent" maxWidth="sm:max-w-md">
                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="border-zinc-800 bg-zinc-900" />
                    </div>
                    <EmailListInput emails={emails} setEmails={setEmails} />
                    <PasswordInput label={editUserId ? "Password Baru (Opsional)" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} required={!editUserId} />
                    {(password || !editUserId) && <PasswordInput label="Konfirmasi Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={!editUserId || password.length > 0} placeholder="" />}
                    <Button type="submit" disabled={isCreating} className="bg-accent hover:bg-accent/80 h-12 w-full font-bold text-black">
                        {isCreating ? "Menyimpan..." : editUserId ? "Edit" : "Tambah"}
                    </Button>
                </form>
            </FormDialog>

            <div className="w-full">
                <DataTable
                    loading={loading}
                    data={filteredUsers}
                    emptyMessage="Gak ada admin."
                    columns={[{ label: "Admin" }, { label: "Status" }, { label: "Tanggal Dibuat" }, { label: "Aksi", className: "text-right" }]}
                    renderRow={(user) => (
                        <TableRow
                            key={user.id}
                            className="group cursor-pointer border-zinc-800 hover:bg-zinc-900/50"
                            onClick={(e) => {
                                if (!e.target.closest("button") && !e.target.closest("a") && !e.target.closest('[role="dialog"]')) {
                                    openEditDialog(user);
                                }
                            }}
                        >
                            <TableCell className="font-medium text-white">
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="h-4 w-4 text-zinc-500" />
                                    {user.username}
                                    {user.id === session?.user?.id && <span className="bg-accent/20 text-accent ml-2 rounded-md px-2 py-1 text-xs">You</span>}
                                </div>
                                <div className="mt-1 ml-6 text-xs text-zinc-500">{user.primary_email}</div>
                            </TableCell>
                            <TableCell>
                                <span className="rounded-md bg-green-500/20 px-2 py-1 text-xs font-bold tracking-wider text-green-400 uppercase">Active</span>
                            </TableCell>
                            <TableCell className="text-zinc-400">
                                {new Date(user.created_at).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <ActionIcon icon={Pencil} title="Edit Admin" variant="edit" onClick={() => openEditDialog(user)} />
                                    <ConfirmDialog
                                        trigger={<ActionIcon icon={Trash2} title="Hapus Admin" variant="delete" disabled={user.id === session?.user?.id} />}
                                        title="Yakin mau hapus admin ini?"
                                        description={
                                            <>
                                                Tindakan ini nggak bisa dibatalin. Akses admin <strong>{user.username}</strong> bakal dicabut permanen.
                                            </>
                                        }
                                        onConfirm={() => handleDeleteUser(user.id)}
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </div>
        </PageContainer>
    );
}
