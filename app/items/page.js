"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemSchema } from "@/lib/schemas";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { GlobalLoading } from "@/components/GlobalLoading";
import { PageContainer } from "@/components/templates/PageContainer";
import { PageHeader } from "@/components/molecules/PageHeader";
import { SearchBar } from "@/components/molecules/SearchBar";
import { DataTable } from "@/components/organisms/DataTable";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function GlobalItems() {
    const [items, setItems] = useState([]);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItemId, setEditItemId] = useState(null);
    const [selectedGameId, setSelectedGameId] = useState("");
    const [filterGameId, setFilterGameId] = useState("all");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(itemSchema),
        defaultValues: { item_name: "", description: "" },
    });

    const fetchData = async () => {
        setLoading(true);
        const { data: itemsData } = await supabase.from("items").select("*, games(name)").order("created_at", { ascending: false });
        setItems(itemsData || []);

        const { data: gamesData } = await supabase.from("games").select("id, name").order("name");
        setGames(gamesData || []);

        setLoading(false);
    };

    const { session } = useAuthGuard(() => fetchData());

    const filteredItems = items.filter((item) => {
        const matchSearch = item.item_name.toLowerCase().includes(search.toLowerCase()) || (item.games?.name && item.games.name.toLowerCase().includes(search.toLowerCase())) || (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

        const matchGame = filterGameId === "all" || item.game_id === filterGameId;
        return matchSearch && matchGame;
    });

    const onAddItem = async (data) => {
        if (!selectedGameId) {
            toast.error("Wajib pilih game dulu boss!");
            return;
        }

        if (editItemId) {
            const { error } = await supabase
                .from("items")
                .update({
                    item_name: data.item_name,
                    description: data.description,
                    game_id: selectedGameId,
                })
                .eq("id", editItemId);

            if (error) {
                toast.error(error.code === "23505" ? "Gagal nyimpen" : "Gagal edit item", {
                    description: error.code === "23505" ? "Nama item ini udah ada di game tersebut!" : error.message,
                });
            } else {
                toast.success("Berhasil!", { description: "Item sukses diedit." });
                closeDialog();
                fetchData();
            }
        } else {
            const { error } = await supabase.from("items").insert([{ item_name: data.item_name, description: data.description, game_id: selectedGameId }]);

            if (error) {
                toast.error(error.code === "23505" ? "Gagal nyimpen" : "Gagal nambah item", {
                    description: error.code === "23505" ? "Nama item ini udah ada di game tersebut!" : error.message,
                });
            } else {
                toast.success("Berhasil!", { description: "Item baru sukses ditambahkan." });
                closeDialog();
                fetchData();
            }
        }
    };

    const closeDialog = () => {
        setIsAddOpen(false);
        setEditItemId(null);
        setSelectedGameId("");
        reset({ item_name: "", description: "" });
    };

    const handleDeleteItem = async (id) => {
        const { error } = await supabase.from("items").delete().eq("id", id);
        if (error) {
            toast.error("Gagal hapus item", { description: error.message });
        } else {
            toast.success("Sukses dibuang!", { description: "Item berhasil dihapus." });
            fetchData();
        }
    };

    if (!session) return <GlobalLoading text="Mengecek sesi..." />;

    const filterItems = [{ id: "all", name: "Semua Game" }, ...games];

    return (
        <PageContainer>
            <PageHeader
                title="Katalog Item Global"
                subtitle="Semua item dari semua game ngumpul di sini."
                icon={Package}
                color="accent"
                rightContent={
                    <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
                        <div className="w-full md:w-56">
                            <ComboboxSelect items={filterItems} value={filterGameId} onSelect={(item) => setFilterGameId(item.id)} placeholder="Semua Game" searchPlaceholder="Cari filter game..." emptyText="Game gak nemu." />
                        </div>
                        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari item..." containerClassName="w-full md:w-56" />
                        <Button
                            className="bg-accent hover:bg-accent/80 w-full font-bold text-black md:w-auto"
                            onClick={() => {
                                closeDialog();
                                setIsAddOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Tambah Item
                        </Button>
                    </div>
                }
            />

            <FormDialog open={isAddOpen} onOpenChange={(open) => (open ? setIsAddOpen(true) : closeDialog())} title={editItemId ? "Edit Item" : "Tambah Item Baru"}>
                <form onSubmit={handleSubmit(onAddItem)} className="space-y-4 pt-4">
                    <div className="flex flex-col space-y-2">
                        <Label>Pilih Game</Label>
                        <ComboboxSelect
                            items={games}
                            value={selectedGameId}
                            onSelect={(g) => setSelectedGameId(g.id)}
                            placeholder="-- Pilih Game --"
                            searchPlaceholder="Cari game..."
                            emptyText="Gak nemu gamenya."
                            onCreateNew={async (name) => {
                                const { data, error } = await supabase.from("games").insert([{ name }]).select().single();
                                if (error) {
                                    toast.error("Gagal bikin game", { description: error.message });
                                    return;
                                }
                                toast.success("Game baru berhasil ditambah!");
                                setGames([...games, data]);
                                setSelectedGameId(data.id);
                            }}
                            createNewLabel={(term) => `Tambah game "${term}"`}
                        />
                    </div>
                    <FormField label="Nama Item" error={errors.item_name?.message} register={register("item_name")} placeholder="Cth: Dark Blade" />
                    <FormField label="Deskripsi (Opsional)" register={register("description")} placeholder="Cth: Senjata mythic" />
                    <Button type="submit" className="bg-accent hover:bg-accent/80 mt-4 w-full font-bold text-black">
                        Gass Simpan
                    </Button>
                </form>
            </FormDialog>

            <div className="w-full">
                <DataTable
                    loading={loading}
                    data={filteredItems}
                    columns={[{ label: "Nama Item" }, { label: "Game" }, { label: "Deskripsi" }, { label: "Aksi", className: "text-right" }]}
                    renderRow={(item) => (
                        <ClickableTableRow key={item.id} href={`/items/${item.id}`} className="group">
                            <TableCell className="flex items-center gap-3 font-medium">
                                <div className="group-hover:border-accent/50 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner transition-colors">
                                    <Package className="h-5 w-5" />
                                </div>
                                <span className="group-hover:text-accent text-base font-bold text-white transition-colors">{item.item_name}</span>
                            </TableCell>
                            <TableCell className="text-primary text-xs font-medium tracking-wider uppercase">{item.games?.name}</TableCell>
                            <TableCell className="text-zinc-400">{item.description || "-"}</TableCell>
                            <TableCell className="flex items-center justify-end gap-1 text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:text-accent hover:bg-accent/10 h-8 w-8 text-zinc-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditItemId(item.id);
                                        setSelectedGameId(item.game_id);
                                        reset({ item_name: item.item_name, description: item.description || "" });
                                        setIsAddOpen(true);
                                    }}
                                    title="Edit Item"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <ConfirmDialog
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:bg-red-500/10 hover:text-red-500" onClick={(e) => e.stopPropagation()} title="Hapus Item">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    }
                                    title="Yakin mau hapus item ini?"
                                    description={`Kalau item "${item.item_name}" dihapus, data stok di semua akun yang nyimpen item ini juga bakal ilang selamanya loh bos.`}
                                    onConfirm={() => handleDeleteItem(item.id)}
                                    confirmText="Ya, Hapus Aja"
                                />
                            </TableCell>
                        </ClickableTableRow>
                    )}
                    emptyMessage="Item belum ada nih bro, coba cari nama lain atau tambah baru."
                />
            </div>
        </PageContainer>
    );
}
