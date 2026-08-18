"use client";

import { Pencil, Plus, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ActionIcon } from "@/components/atoms/ActionIcon";
import { CopyButton } from "@/components/CopyButton";
import { GlobalLoading } from "@/components/GlobalLoading";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { DetailHeader } from "@/components/molecules/DetailHeader";
import { FormDialog } from "@/components/molecules/FormDialog";
import { SearchBar } from "@/components/molecules/SearchBar";
import { DataTable } from "@/components/organisms/DataTable";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { supabase } from "@/lib/supabase";
import { createAccountFromCombo,isDuplicateError } from "@/lib/supabaseHelpers";
import { getInitials } from "@/lib/utils";

export default function ItemDetail() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Add account to item
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedAcc, setSelectedAcc] = useState("");
    const [privateServerLink, setPrivateServerLink] = useState("");

    // Edit item
    const [isEditItemOpen, setIsEditItemOpen] = useState(false);
    const [editItemName, setEditItemName] = useState("");
    const [editItemDesc, setEditItemDesc] = useState("");

    const { session } = useAuthGuard(() => fetchData(), [params.id]);

    // Auto-fetch PS link when account selected
    useEffect(() => {
        if (selectedAcc && item?.games?.requires_private_server) {
            supabase
                .from("account_games")
                .select("private_server_link")
                .eq("account_id", selectedAcc)
                .eq("game_id", item.game_id)
                .single()
                .then(({ data }) => setPrivateServerLink(data?.private_server_link || ""));
        } else {
            setPrivateServerLink("");
        }
    }, [selectedAcc, item]);

    const fetchData = async () => {
        setLoading(true);
        const [{ data: itemData }, { data: accData }, { data: allAccData }] = await Promise.all([supabase.from("items").select("*, games(name, requires_private_server)").eq("id", params.id).single(), supabase.from("account_items").select("*, accounts(username)").eq("item_id", params.id), supabase.from("accounts").select("*")]);
        setItem(itemData);
        setAccounts(accData || []);
        setAllAccounts(allAccData || []);
        setLoading(false);
    };

    const handleEditItem = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from("items").update({ item_name: editItemName, description: editItemDesc }).eq("id", params.id);
        if (error) {
            toast.error("Gagal edit item", { description: error.message });
        } else {
            toast.success("Berhasil diubah!");
            setIsEditItemOpen(false);
            fetchData();
        }
    };

    const handleDeleteItem = async () => {
        const { error } = await supabase.from("items").delete().eq("id", params.id);
        if (error) {
            toast.error("Gagal hapus item", { description: error.message });
        } else {
            toast.success("Item berhasil dihapus!");
            router.push("/items");
        }
    };

    const filteredAccounts = accounts.filter((acc) => acc.accounts?.username.toLowerCase().includes(search.toLowerCase()) || (acc.stock_notes && acc.stock_notes.toLowerCase().includes(search.toLowerCase())));

    const handleToggleStatus = async (accountItemId, currentStatus) => {
        const newStatus = !currentStatus;
        setAccounts((prev) => prev.map((a) => (a.id === accountItemId ? { ...a, is_available: newStatus } : a)));
        const { error } = await supabase.from("account_items").update({ is_available: newStatus }).eq("id", accountItemId);
        if (error) {
            toast.error("Gagal update status", { description: error.message });
            setAccounts((prev) => prev.map((a) => (a.id === accountItemId ? { ...a, is_available: currentStatus } : a)));
        } else {
            toast.success(newStatus ? "Stok Aman bro!" : "Waduh ludes bro.");
        }
    };

    const handleUpdateNotes = async (accountItemId, newNotes) => {
        setAccounts((prev) => prev.map((a) => (a.id === accountItemId ? { ...a, stock_notes: newNotes } : a)));
        const { error } = await supabase.from("account_items").update({ stock_notes: newNotes }).eq("id", accountItemId);
        if (error) {
            toast.error("Gagal update catatan", { description: error.message });
            fetchData();
        } else {
            toast.success("Catatan udah diganti!");
        }
    };

    const handleAddAccountToItem = async (e) => {
        e.preventDefault();
        if (!selectedAcc) return toast.error("Pilih akunnya dulu bos!");
        if (item.games?.requires_private_server && (!privateServerLink || privateServerLink.trim() === ""))
            return toast.error("Wajib isi Link Private Server!", {
                description: "Game ini butuh private server bos!",
            });

        // Upsert account_games
        const { data: existAccGame } = await supabase.from("account_games").select("id").eq("account_id", selectedAcc).eq("game_id", item.game_id).maybeSingle();
        if (existAccGame) {
            if (item.games?.requires_private_server && privateServerLink) {
                const { error: updateErr } = await supabase.from("account_games").update({ private_server_link: privateServerLink }).eq("id", existAccGame.id);
                if (updateErr) {
                    isDuplicateError(updateErr) ? toast.error("Link Duplikat!", { description: "Link ini udah dipake akun lain bro." }) : toast.error("Gagal update link", { description: updateErr.message });
                    return;
                }
            }
        } else {
            const { error: insertErr } = await supabase.from("account_games").insert([
                {
                    account_id: selectedAcc,
                    game_id: item.game_id,
                    private_server_link: item.games?.requires_private_server ? privateServerLink : null,
                },
            ]);
            if (insertErr) {
                isDuplicateError(insertErr) ? toast.error("Link Duplikat!", { description: "Link ini udah dipake akun lain bro." }) : toast.error("Gagal nambahin game ke akun", { description: insertErr.message });
                return;
            }
        }

        const { error } = await supabase.from("account_items").insert([{ account_id: selectedAcc, item_id: item.id, is_available: true }]);
        if (error) {
            error.code === "23505" ? toast.error("Gagal nambahin", { description: "Akun ini udah jualan item ini bro!" }) : toast.error("Gagal nambahin", { description: error.message });
        } else {
            toast.success("Berhasil ditautkan!", { description: "Akun sekarang jualan item ini." });
            setIsAddOpen(false);
            setSelectedAcc("");
            setPrivateServerLink("");
            fetchData();
        }
    };

    const handleRemoveAccountFromItem = async (accountItemId, accountId) => {
        const { error } = await supabase.from("account_items").delete().eq("id", accountItemId);
        if (error) {
            toast.error("Gagal menghapus", { description: error.message });
            return;
        }
        const { data: otherItems } = await supabase.from("account_items").select("id, items!inner(game_id)").eq("account_id", accountId).eq("items.game_id", item.game_id);
        if (!otherItems || otherItems.length === 0) await supabase.from("account_games").delete().eq("account_id", accountId).eq("game_id", item.game_id);
        toast.success("Dihapus!", { description: "Akun udah dicopot dari item ini." });
        fetchData();
    };

    if (loading && !item) return <GlobalLoading text="Loading data item..." />;
    if (!session) return <GlobalLoading text="Mengecek sesi..." />;

    return (
        <PageContainer>
            <DetailHeader
                title={item.item_name}
                subtitle={
                    <>
                        Game: <span className="text-accent">{item.games?.name}</span> | Item ID: <span className="font-mono text-xs text-zinc-500">{item.id}</span>
                    </>
                }
                avatarShape="xl"
                rightContent={
                    <div className="flex items-center gap-2">
                        <ActionIcon
                            icon={Pencil}
                            title="Edit Item"
                            variant="edit"
                            onClick={() => {
                                setEditItemName(item.item_name);
                                setEditItemDesc(item.description || "");
                                setIsEditItemOpen(true);
                            }}
                            className="h-10 w-10"
                        />
                        <ConfirmDialog trigger={<ActionIcon icon={Trash2} title="Hapus Item" variant="delete" className="h-10 w-10" />} title="Yakin mau hapus item ini?" description="Awas bro, hapus item ini bakal ngilangin data stok di semua akun juga. Lanjut?" onConfirm={handleDeleteItem} />
                    </div>
                }
            />

            {/* Edit Item Dialog */}
            <FormDialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen} title="Edit Item" titleClassName="neon-text-accent">
                <form onSubmit={handleEditItem} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Nama Item</Label>
                        <Input value={editItemName} onChange={(e) => setEditItemName(e.target.value)} className="border-zinc-800 bg-zinc-900" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Deskripsi (Opsional)</Label>
                        <Input value={editItemDesc} onChange={(e) => setEditItemDesc(e.target.value)} className="border-zinc-800 bg-zinc-900" />
                    </div>
                    <Button type="submit" className="bg-accent hover:bg-accent/80 w-full font-bold text-black">
                        Simpan Perubahan
                    </Button>
                </form>
            </FormDialog>

            {/* Content */}
            <div className="space-y-4">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <h2 className="neon-text-primary text-xl font-bold">Status Stok di Akun</h2>
                    <div className="flex w-full items-center gap-2 md:w-auto">
                        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari akun..." containerClassName="w-full md:w-64" />
                        <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/80 h-10 px-4 font-bold whitespace-nowrap text-black"
                            onClick={() => {
                                setSelectedAcc("");
                                setPrivateServerLink("");
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="mr-1 h-4 w-4" /> Tautkan Akun
                        </Button>
                    </div>
                </div>

                {/* Add Account Dialog */}
                <FormDialog open={isAddOpen} onOpenChange={setIsAddOpen} title="Tautkan Akun ke Item" titleClassName="neon-text-primary">
                    <form onSubmit={handleAddAccountToItem} className="space-y-4 pt-4">
                        <div className="flex w-full flex-col space-y-2">
                            <Label>Pilih Akun</Label>
                            <ComboboxSelect
                                items={allAccounts}
                                value={selectedAcc}
                                onSelect={(acc) => setSelectedAcc(acc.id)}
                                getItemValue={(acc) => acc.username}
                                placeholder="-- Pilih Akun Bro --"
                                searchPlaceholder="Cari username akun..."
                                emptyText="Akun gak ketemu bro."
                                onCreateNew={async (username) => {
                                    const { data } = await createAccountFromCombo(username);
                                    if (data) {
                                        setAllAccounts([...allAccounts, data]);
                                        setSelectedAcc(data.id);
                                    }
                                }}
                                createNewLabel={(term) => `Daftarin "${term}"`}
                            />
                        </div>
                        {item?.games?.requires_private_server && (
                            <div className="mt-4 flex w-full flex-col space-y-2">
                                <Label>Link Private Server (Wajib buat game ini)</Label>
                                <Input placeholder="https://..." value={privateServerLink} onChange={(e) => setPrivateServerLink(e.target.value)} className="border-zinc-800 bg-zinc-900 text-white" />
                                <p className="text-xs text-zinc-500">Kalo sebelumnya udah diisi, otomatis muncul di sini. Boleh diganti kalau mau.</p>
                            </div>
                        )}
                        <Button type="submit" className="bg-primary mt-4 w-full font-bold text-black">
                            Gass Tautkan
                        </Button>
                    </form>
                </FormDialog>

                <div className="w-full">
                    <DataTable
                        loading={loading}
                        data={filteredAccounts}
                        emptyMessage="Belum ada stok di akun mana pun."
                        columns={[{ label: "Nama Akun" }, { label: "Status (Aman/Ludes)" }, { label: "Catatan & Aksi", className: "text-right" }]}
                        renderRow={(acc) => (
                            <TableRow
                                key={acc.id}
                                className="group cursor-pointer border-zinc-800 hover:bg-zinc-900/50"
                                onClick={(e) => {
                                    if (!e.target.closest("button") && !e.target.closest("a") && !e.target.closest('[role="dialog"]') && !e.target.closest(".switch-no-nav")) router.push(`/accounts/${acc.account_id}`);
                                }}
                            >
                                <TableCell className="flex items-center gap-3 font-medium">
                                    <div className="group-hover:border-primary/50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner transition-colors">{getInitials(acc.accounts?.username)}</div>
                                    <div className="group-hover:text-primary flex items-center gap-2 font-bold text-white transition-colors">
                                        {acc.accounts?.username}{" "}
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <CopyButton textToCopy={acc.accounts?.username} className="h-6 w-6" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="switch-no-nav flex items-center gap-3">
                                        <Switch checked={acc.is_available} onCheckedChange={() => handleToggleStatus(acc.id, acc.is_available)} className="data-[state=checked]:bg-primary" />
                                        <span className={`flex items-center gap-1 text-sm font-bold ${acc.is_available ? "text-green-500" : "text-red-500"}`}>
                                            {acc.is_available ? (
                                                <>
                                                    <ShieldCheck className="h-4 w-4" /> Aman bro
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldAlert className="h-4 w-4" /> Ludes
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="max-w-[150px] truncate text-sm text-zinc-400">{acc.stock_notes || "-"}</span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <ActionIcon icon={Pencil} title="Edit Catatan" variant="edit" />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 border-zinc-800 bg-zinc-950" align="end">
                                                <div className="grid gap-4">
                                                    <div className="space-y-2">
                                                        <h4 className="neon-text-accent leading-none font-medium">Edit Catatan Stok</h4>
                                                        <p className="text-sm text-zinc-500">Tulis apa aja buat pengingat admin.</p>
                                                    </div>
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            handleUpdateNotes(acc.id, e.target.notes.value);
                                                        }}
                                                        className="grid gap-2"
                                                    >
                                                        <Input id="notes" defaultValue={acc.stock_notes} className="h-8 border-zinc-800 bg-zinc-900" placeholder="Cth: Nunggu reset jam 12 malem" />
                                                        <Button type="submit" size="sm" className="bg-accent hover:bg-accent/80 text-black">
                                                            Simpan Catatan
                                                        </Button>
                                                    </form>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <ConfirmDialog trigger={<ActionIcon icon={Trash2} title="Hapus Akun" variant="delete" />} title="Yakin mau hapus akun ini dari item?" description="Stok item di akun ini bakal hilang dari daftar." onConfirm={() => handleRemoveAccountFromItem(acc.id, acc.account_id)} confirmText="Hapus!" cancelText="Gak Jadi" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </div>
            </div>
        </PageContainer>
    );
}
