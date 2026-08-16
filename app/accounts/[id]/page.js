"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/lib/schemas";
import { isDuplicateError, validateUniqueItems, processItemLinks, createGameFromCombo } from "@/lib/supabaseHelpers";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { GlobalLoading } from "@/components/GlobalLoading";
import { CopyButton } from "@/components/CopyButton";
import { PageContainer } from "@/components/templates/PageContainer";
import { DetailHeader } from "@/components/molecules/DetailHeader";
import { DataTable } from "@/components/organisms/DataTable";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { PrivateServerLinkCell } from "@/components/molecules/PrivateServerLinkCell";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { EditLinkDialog } from "@/components/organisms/EditLinkDialog";
import { Pencil, Trash2, CircleDollarSign, Plus, PackageX, PackageCheck } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function AccountDetail() {
    const params = useParams();
    const router = useRouter();
    const [account, setAccount] = useState(null);
    const [games, setGames] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("games");
    const [gameSearch, setGameSearch] = useState("");
    const [itemSearch, setItemSearch] = useState("");
    const [allGames, setAllGames] = useState([]);

    // Edit account
    const [isEditOpen, setIsEditOpen] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({ resolver: zodResolver(accountSchema) });

    // Add Game dialog
    const [isAddGameOpen, setIsAddGameOpen] = useState(false);
    const [selectedGameId, setSelectedGameId] = useState("");
    const [privateServerLink, setPrivateServerLink] = useState("");
    const [gameItemsLinks, setGameItemsLinks] = useState([]);

    // Add Item dialog
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [addItemGameId, setAddItemGameId] = useState(null);
    const [addItemItemData, setAddItemItemData] = useState({ id: null, name: "" });

    // Edit link dialog
    const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
    const [editGameData, setEditGameData] = useState(null);
    const [newLink, setNewLink] = useState("");

    // Edit notes dialog
    const [isEditNotesOpen, setIsEditNotesOpen] = useState(false);
    const [editItemData, setEditItemData] = useState(null);
    const [newNotes, setNewNotes] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const [{ data: accData }, { data: gamesData }, { data: itemsData }, { data: allGamesData }] = await Promise.all([supabase.from("accounts").select("*").eq("id", params.id).single(), supabase.from("account_games").select("*, games(id, name, image_url, requires_private_server)").eq("account_id", params.id), supabase.from("account_items").select("*, items(id, item_name, game_id, games(name))").eq("account_id", params.id), supabase.from("games").select("*, items(id, item_name)")]);
        setAccount(accData);
        setGames(gamesData || []);
        setItems(itemsData || []);
        setAllGames(allGamesData || []);
        setLoading(false);
    };

    const { session } = useAuthGuard(() => fetchData(), [params.id]);

    // ─── Account CRUD ───
    const toggleStatus = async () => {
        const newStatus = account.status === "EMPTY_ROBUX" ? "ACTIVE" : "EMPTY_ROBUX";
        const { error } = await supabase.from("accounts").update({ status: newStatus }).eq("id", account.id);
        if (error) {
            toast.error("Gagal ganti status", { description: error.message });
        } else {
            toast.success("Status diubah!", {
                description: `Akun sekarang ditandai ${newStatus === "EMPTY_ROBUX" ? "Habis Robux" : "Aktif"}.`,
            });
            fetchData();
        }
    };

    const handleDelete = async () => {
        const { error } = await supabase.from("accounts").delete().eq("id", params.id);
        if (error) {
            toast.error("Gagal hapus bro", { description: error.message });
        } else {
            toast.success("Dibuang!", { description: "Akun udah lenyap." });
            router.push("/accounts");
        }
    };

    const onSubmitEdit = async (data) => {
        const { error } = await supabase.from("accounts").update({ username: data.username, notes: data.notes }).eq("id", params.id);
        if (error) {
            toast.error("Waduh, gagal update akun", { description: error.message });
        } else {
            toast.success("Akun diupdate!");
            setIsEditOpen(false);
            fetchData();
        }
    };

    // ─── Add Game Handler ───
    const resetAddGame = () => {
        setSelectedGameId("");
        setPrivateServerLink("");
        setGameItemsLinks([]);
    };

    const onAddGame = async (e) => {
        e.preventDefault();
        if (!selectedGameId) return toast.error("Pilih game dulu bos!");
        const selGame = allGames.find((g) => g.id === selectedGameId);

        if (selGame?.requires_private_server && !privateServerLink)
            return toast.error("Wajib isi link!", {
                description: "Game ini butuh Private Server Link bro!",
            });

        const validItems = gameItemsLinks.filter((lnk) => lnk.item_id !== "" || lnk.new_name !== "");
        if (!validateUniqueItems(validItems)) return;

        // Upsert account_games
        const { data: existAccGame } = await supabase.from("account_games").select("id").eq("account_id", params.id).eq("game_id", selectedGameId).maybeSingle();
        if (existAccGame) {
            if (selGame?.requires_private_server && privateServerLink) {
                const { error } = await supabase.from("account_games").update({ private_server_link: privateServerLink }).eq("id", existAccGame.id);
                if (error) return toast.error("Gagal update link", { description: error.message });
            }
        } else {
            const { error } = await supabase.from("account_games").insert([
                {
                    account_id: params.id,
                    game_id: selectedGameId,
                    private_server_link: selGame?.requires_private_server ? privateServerLink : null,
                },
            ]);
            if (error) return toast.error("Gagal nambah game", { description: error.message });
        }

        const processedCount = await processItemLinks(validItems, {
            gameId: selectedGameId,
            accountId: params.id,
        });
        toast.success("Masuk pak eko!", {
            description: `Game ditautin${processedCount > 0 ? ` plus ${processedCount} item ditambahkan` : ""}.`,
        });
        resetAddGame();
        setIsAddGameOpen(false);
        fetchData();
    };

    // ─── Add Item Handler ───
    const resetAddItem = () => {
        setAddItemGameId(null);
        setAddItemItemData({ id: null, name: "" });
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!addItemGameId) return toast.error("Pilih game dulu bos!");
        if (!addItemItemData.id && !addItemItemData.name) return toast.error("Pilih atau ketik nama item!");

        // Check/create account_games link
        const { data: existAccGame } = await supabase.from("account_games").select("id").eq("account_id", params.id).eq("game_id", addItemGameId).maybeSingle();
        if (!existAccGame) {
            const selGame = allGames.find((g) => g.id === addItemGameId);
            if (selGame?.requires_private_server)
                return toast.error("Gagal menautkan otomatis", {
                    description: "Game ini butuh Private Server Link. Tautin dulu lewat tab 'List Game' ya!",
                });
            await supabase.from("account_games").insert([{ account_id: params.id, game_id: addItemGameId }]);
        }

        // Find or create item
        let finalItemId = addItemItemData.id;
        if (!finalItemId && addItemItemData.name) {
            const { data: existItem } = await supabase.from("items").select("id").eq("game_id", addItemGameId).ilike("item_name", addItemItemData.name).maybeSingle();
            if (existItem) {
                finalItemId = existItem.id;
            } else {
                const { data: insertedItem, error } = await supabase
                    .from("items")
                    .insert([{ game_id: addItemGameId, item_name: addItemItemData.name }])
                    .select()
                    .single();
                if (!error) finalItemId = insertedItem.id;
            }
        }

        if (finalItemId) {
            const { data: alreadyLinked } = await supabase.from("account_items").select("id").eq("account_id", params.id).eq("item_id", finalItemId).maybeSingle();
            if (alreadyLinked) return toast.error("Udah ada", { description: "Item ini udah tertaut ke akun ini!" });
            const { error } = await supabase.from("account_items").insert([{ item_id: finalItemId, account_id: params.id, is_available: true }]);
            if (error) {
                toast.error("Gagal nambah item", { description: error.message });
            } else {
                toast.success("Item ditambahkan!");
                setIsAddItemOpen(false);
                resetAddItem();
                fetchData();
            }
        }
    };

    // ─── Remove Handlers ───
    const handleRemoveGame = async (gameId) => {
        const { data: itemsOfGame } = await supabase.from("items").select("id").eq("game_id", gameId);
        if (itemsOfGame?.length > 0)
            await supabase
                .from("account_items")
                .delete()
                .eq("account_id", params.id)
                .in(
                    "item_id",
                    itemsOfGame.map((i) => i.id)
                );
        const { error } = await supabase.from("account_games").delete().eq("account_id", params.id).eq("game_id", gameId);
        if (error) {
            toast.error("Gagal hapus game", { description: error.message });
        } else {
            toast.success("Dihapus!", {
                description: "Game beserta semua item-nya berhasil dihapus dari akun ini.",
            });
            fetchData();
        }
    };

    const handleRemoveItem = async (accountItemId, gameId) => {
        const { error } = await supabase.from("account_items").delete().eq("id", accountItemId);
        if (error) {
            toast.error("Gagal hapus item", { description: error.message });
            return;
        }
        const { data: otherItems } = await supabase.from("account_items").select("id, items!inner(game_id)").eq("account_id", params.id).eq("items.game_id", gameId);
        if (!otherItems || otherItems.length === 0) await supabase.from("account_games").delete().eq("account_id", params.id).eq("game_id", gameId);
        toast.success("Item Dihapus!");
        fetchData();
    };

    // ─── Edit Handlers ───
    const handleUpdateLink = async (e) => {
        e.preventDefault();
        if (editGameData?.games?.requires_private_server && !newLink.trim()) return toast.error("Wajib isi link!");
        const { error } = await supabase
            .from("account_games")
            .update({ private_server_link: newLink.trim() || null })
            .eq("id", editGameData.id);
        if (error) {
            isDuplicateError(error)
                ? toast.error("Gagal update", {
                      description: "Link Private Server ini udah dipakai di tempat lain!",
                  })
                : toast.error("Gagal update link", { description: error.message });
        } else {
            toast.success("Link berhasil diupdate!");
            setIsEditLinkOpen(false);
            fetchData();
        }
    };

    const handleUpdateNotes = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from("account_items").update({ stock_notes: newNotes }).eq("id", editItemData.id);
        if (error) {
            toast.error("Gagal update catatan", { description: error.message });
        } else {
            toast.success("Catatan berhasil diupdate!");
            setIsEditNotesOpen(false);
            fetchData();
        }
    };

    const toggleItemStatus = async (accountItemId, currentStatus) => {
        const { error } = await supabase.from("account_items").update({ is_available: !currentStatus }).eq("id", accountItemId);
        if (error) {
            toast.error("Gagal ubah status", { description: error.message });
        } else {
            toast.success("Status stok diubah!");
            fetchData();
        }
    };

    // ─── Filtered Lists ───
    const filteredGames = games.filter((g) => g.games?.name.toLowerCase().includes(gameSearch.toLowerCase()));
    const filteredItems = items.filter((i) => i.items?.item_name.toLowerCase().includes(itemSearch.toLowerCase()));

    if (loading && !account) return <GlobalLoading text="Loading data akun..." />;
    if (!session) return <GlobalLoading text="Mengecek sesi..." />;

    return (
        <PageContainer>
            <DetailHeader
                title={account?.username}
                subtitle={
                    <>
                        Status Robux: {account?.status === "EMPTY_ROBUX" ? <span className="font-bold text-red-500">Habis</span> : <span className="font-bold text-green-500">Tersedia</span>}
                        <span className="ml-2 text-xs text-zinc-500">| Akun ID: {account?.id}</span>
                    </>
                }
                avatarShape="circle"
                rightContent={
                    <>
                        <ActionIcon icon={CircleDollarSign} title={account?.status === "EMPTY_ROBUX" ? "Tandai Aktif" : "Tandai Habis Robux"} variant={account?.status === "EMPTY_ROBUX" ? "success" : "warning"} onClick={toggleStatus} className="h-10 w-10" />
                        <ActionIcon
                            icon={Pencil}
                            title="Edit Akun"
                            variant="edit"
                            onClick={() => {
                                reset({ username: account?.username, notes: account?.notes || "" });
                                setIsEditOpen(true);
                            }}
                            className="h-10 w-10"
                        />
                        <ConfirmDialog trigger={<ActionIcon icon={Trash2} title="Hapus Akun" variant="delete" className="h-10 w-10" />} title="Yakin mau hapus akun ini?" description="Kalo dihapus, akun ini bakal ketendang dari semua game dan item yang nyangkut. Gak bisa balik lagi lho!" onConfirm={handleDelete} />
                    </>
                }
            />

            {/* Edit Account Dialog */}
            <FormDialog open={isEditOpen} onOpenChange={setIsEditOpen} title="Edit Akun" titleClassName="neon-text-accent">
                <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4 pt-4">
                    <FormField label="Username / Email Akun" error={errors.username?.message} register={register("username")} placeholder="Cth: player_sakti123" />
                    <FormField label="Catatan Tambahan (Opsional)" register={register("notes")} placeholder="Cth: Akun tumbal" />
                    <Button type="submit" className="bg-accent hover:bg-accent/80 mt-4 w-full font-bold text-black">
                        Gass Simpan
                    </Button>
                </form>
            </FormDialog>

            <EditLinkDialog open={isEditLinkOpen} onOpenChange={setIsEditLinkOpen} entityLabel="Game" entityName={editGameData?.games?.name} link={newLink} onLinkChange={setNewLink} onSubmit={handleUpdateLink} />

            {/* Edit Notes Dialog */}
            <FormDialog open={isEditNotesOpen} onOpenChange={setIsEditNotesOpen} title="Edit Catatan Item" titleClassName="neon-text-accent">
                <form onSubmit={handleUpdateNotes} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-400">
                            Item: <span className="text-white">{editItemData?.items?.item_name}</span>
                        </Label>
                        <Input placeholder="Cth: Laku, dipindah, dsb..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="border-zinc-800 bg-zinc-900" />
                    </div>
                    <Button type="submit" className="bg-accent hover:bg-accent/80 mt-2 w-full font-bold text-black">
                        Update Catatan
                    </Button>
                </form>
            </FormDialog>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-col">
                <TabsList className="mx-auto grid h-12 w-full max-w-md grid-cols-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
                    <TabsTrigger value="games" className="data-[state=active]:bg-primary rounded-lg transition-all data-[state=active]:font-bold data-[state=active]:text-white">
                        List Game
                    </TabsTrigger>
                    <TabsTrigger value="items" className="data-[state=active]:bg-accent rounded-lg transition-all data-[state=active]:font-bold data-[state=active]:text-black">
                        List Item
                    </TabsTrigger>
                </TabsList>

                {/* ═══ GAMES TAB ═══ */}
                <TabsContent value="games" className="mt-6 space-y-4">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <h2 className="neon-text-primary text-xl font-bold">Game yang Terhubung</h2>
                        <div className="flex w-full items-center gap-2 md:w-auto">
                            <Input placeholder="Cari nama game..." value={gameSearch} onChange={(e) => setGameSearch(e.target.value)} className="w-full border-zinc-800 bg-zinc-900 md:w-64" />
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/80 font-bold text-black"
                                onClick={() => {
                                    resetAddGame();
                                    setIsAddGameOpen(true);
                                }}
                            >
                                <Plus className="mr-1 h-4 w-4" /> Tautkan Game
                            </Button>
                        </div>
                    </div>

                    {/* Add Game Dialog */}
                    <FormDialog
                        open={isAddGameOpen}
                        onOpenChange={(open) => {
                            if (!open) resetAddGame();
                            setIsAddGameOpen(open);
                        }}
                        title="Tautkan Game ke Akun"
                        titleClassName="neon-text-primary"
                    >
                        <form onSubmit={onAddGame} className="space-y-4 pt-4">
                            <div className="flex w-full flex-col space-y-2">
                                <Label>Pilih Game</Label>
                                <ComboboxSelect
                                    items={allGames}
                                    value={selectedGameId}
                                    onSelect={(g) => setSelectedGameId(g.id)}
                                    placeholder="-- Pilih Game --"
                                    searchPlaceholder="Cari nama game..."
                                    emptyText="Game gak ketemu bro."
                                    onCreateNew={async (name) => {
                                        const { data } = await createGameFromCombo(name);
                                        if (data) {
                                            setAllGames([...allGames, data]);
                                            setSelectedGameId(data.id);
                                        }
                                    }}
                                    createNewLabel={(term) => `Tambah game "${term}"`}
                                    renderItem={(g) => (
                                        <>
                                            {g.name}
                                            {g.requires_private_server && <span className="ml-2 inline-flex items-center rounded-sm border border-red-900 bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-500">WAJIB LINK</span>}
                                        </>
                                    )}
                                />
                            </div>
                            {selectedGameId && allGames.find((g) => g.id === selectedGameId)?.requires_private_server && (
                                <div className="space-y-2">
                                    <Label>
                                        Private Server Link <span className="text-red-500">* (Wajib)</span>
                                    </Label>
                                    <Input placeholder="https://..." value={privateServerLink} onChange={(e) => setPrivateServerLink(e.target.value)} className="border-zinc-800 bg-zinc-900" required />
                                </div>
                            )}
                            {selectedGameId && (
                                <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Tambahkan Item dari Game Ini (Opsional)</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setGameItemsLinks([...gameItemsLinks, { item_id: "", new_name: "" }])} className="border-primary text-primary hover:bg-primary/20 h-7 text-xs">
                                            <Plus className="mr-1 h-3 w-3" /> Tambah Item
                                        </Button>
                                    </div>
                                    {gameItemsLinks.map((lnkObj, idx) => {
                                        const gameItems = allGames.find((g) => g.id === selectedGameId)?.items || [];
                                        return (
                                            <div key={idx} className="mt-2 flex items-center gap-2">
                                                <ComboboxSelect
                                                    items={gameItems}
                                                    value={lnkObj.item_id}
                                                    onSelect={(itm) => {
                                                        const newArr = [...gameItemsLinks];
                                                        newArr[idx] = { item_id: itm.id, new_name: "" };
                                                        setGameItemsLinks(newArr);
                                                    }}
                                                    getItemValue={(itm) => itm.item_name}
                                                    placeholder={lnkObj.new_name ? `Item Baru: ${lnkObj.new_name}` : "-- Pilih Item --"}
                                                    searchPlaceholder="Cari item..."
                                                    emptyText="Gak ada item itu bro."
                                                    onCreateNew={(name) => {
                                                        const newArr = [...gameItemsLinks];
                                                        newArr[idx] = { item_id: "", new_name: name };
                                                        setGameItemsLinks(newArr);
                                                    }}
                                                    createNewLabel={(term) => `Tambah item "${term}"`}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0 text-red-500 hover:bg-red-950 hover:text-red-400"
                                                    onClick={() => {
                                                        const newArr = [...gameItemsLinks];
                                                        newArr.splice(idx, 1);
                                                        setGameItemsLinks(newArr);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <Button type="submit" className="bg-primary mt-4 w-full font-bold text-black">
                                Gass Tautkan
                            </Button>
                        </form>
                    </FormDialog>

                    <DataTable
                        loading={loading}
                        data={filteredGames}
                        emptyMessage="Game nggak ada atau nggak ketemu."
                        columns={[{ label: "Nama Game" }, { label: "Link Private Server" }, { label: "Ditambahkan", className: "text-right" }, { label: "Aksi", className: "text-right" }]}
                        renderRow={(g) => (
                            <ClickableTableRow key={g.id} href={`/games/${g.games?.id}`}>
                                <TableCell className="flex items-center gap-3 font-medium">
                                    {g.games?.image_url ? <div className="h-8 w-8 shrink-0 rounded-md bg-zinc-800 bg-cover bg-center" style={{ backgroundImage: `url(${g.games?.image_url})` }} /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold text-zinc-500">{getInitials(g.games?.name)}</div>}
                                    <div className="hover:text-primary transition-colors">{g.games?.name}</div>
                                </TableCell>
                                <TableCell>
                                    <PrivateServerLinkCell link={g.private_server_link} />
                                </TableCell>
                                <TableCell className="text-right text-sm text-zinc-400">{new Date(g.created_at).toLocaleDateString("id-ID")}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <ActionIcon
                                            icon={Pencil}
                                            variant="edit"
                                            title="Edit Link"
                                            onClick={() => {
                                                setEditGameData(g);
                                                setNewLink(g.private_server_link || "");
                                                setIsEditLinkOpen(true);
                                            }}
                                        />
                                        <ConfirmDialog
                                            trigger={<ActionIcon icon={Trash2} variant="delete" title="Hapus Game" />}
                                            title="Hapus Game dari Akun?"
                                            description={
                                                <>
                                                    Ini bakal menghapus kaitan game ini dari akun <strong>{account?.username}</strong>, TERMASUK semua item dari game ini yang nempel di akun ini! Gak bisa di-undo lho.
                                                </>
                                            }
                                            onConfirm={() => handleRemoveGame(g.game_id)}
                                        />
                                    </div>
                                </TableCell>
                            </ClickableTableRow>
                        )}
                    />
                </TabsContent>

                {/* ═══ ITEMS TAB ═══ */}
                <TabsContent value="items" className="mt-6 space-y-4">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <h2 className="neon-text-accent text-xl font-bold">Item di Akun Ini</h2>
                        <div className="flex w-full items-center gap-2 md:w-auto">
                            <Input placeholder="Cari nama item..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} className="w-full border-zinc-800 bg-zinc-900 md:w-64" />
                            <Button
                                size="sm"
                                className="bg-accent hover:bg-accent/80 font-bold text-black"
                                onClick={() => {
                                    resetAddItem();
                                    setIsAddItemOpen(true);
                                }}
                            >
                                <Plus className="mr-1 h-4 w-4" /> Tautkan Item
                            </Button>
                        </div>
                    </div>

                    {/* Add Item Dialog */}
                    <FormDialog
                        open={isAddItemOpen}
                        onOpenChange={(open) => {
                            if (!open) resetAddItem();
                            setIsAddItemOpen(open);
                        }}
                        title="Tautkan Item ke Akun"
                        titleClassName="neon-text-accent"
                    >
                        <form onSubmit={handleAddItem} className="space-y-4 pt-4">
                            <div className="flex w-full flex-col space-y-2">
                                <Label>Pilih Game Dulu</Label>
                                <ComboboxSelect
                                    items={allGames}
                                    value={addItemGameId}
                                    onSelect={(g) => {
                                        setAddItemGameId(g.id);
                                        setAddItemItemData({ id: null, name: "" });
                                    }}
                                    placeholder="-- Pilih Game --"
                                    searchPlaceholder="Cari game..."
                                    emptyText="Gak nemu gamenya bro."
                                    onCreateNew={async (name) => {
                                        const { data } = await createGameFromCombo(name);
                                        if (data) {
                                            setAllGames([...allGames, data]);
                                            setAddItemGameId(data.id);
                                            setAddItemItemData({ id: null, name: "" });
                                        }
                                    }}
                                    createNewLabel={(term) => `Tambah game "${term}"`}
                                />
                            </div>
                            {addItemGameId && (
                                <div className="mt-4 flex w-full flex-col space-y-2">
                                    <Label>Pilih atau Ketik Item</Label>
                                    <ComboboxSelect items={allGames.find((g) => g.id === addItemGameId)?.items || []} value={addItemItemData.id} onSelect={(itm) => setAddItemItemData({ id: itm.id, name: itm.item_name })} getItemValue={(itm) => itm.item_name} placeholder={addItemItemData.name || "-- Pilih Item --"} searchPlaceholder="Cari atau ketik nama item..." emptyText="Gak nemu itemnya." onCreateNew={(name) => setAddItemItemData({ id: null, name })} createNewLabel={(term) => `Tambah item "${term}"`} />
                                </div>
                            )}
                            <Button type="submit" className="bg-accent hover:bg-accent/80 mt-4 w-full font-bold text-black" disabled={!addItemGameId || (!addItemItemData.id && !addItemItemData.name)}>
                                Gass Tautkan Item
                            </Button>
                        </form>
                    </FormDialog>

                    <DataTable
                        loading={loading}
                        data={filteredItems}
                        emptyMessage="Item nggak ada atau nggak ketemu."
                        columns={[{ label: "Nama Item" }, { label: "Game" }, { label: "Status Stok" }, { label: "Catatan" }, { label: "Aksi", className: "text-right" }]}
                        renderRow={(item) => (
                            <ClickableTableRow key={item.id} href={`/items/${item.items?.id}`}>
                                <TableCell className="flex items-center gap-3 font-medium">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner">{getInitials(item.items?.item_name || "I")}</div>
                                    <div className="hover:text-accent flex items-center gap-2 transition-colors">
                                        {item.items?.item_name}{" "}
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <CopyButton textToCopy={item.items?.item_name} className="h-6 w-6" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-400">{item.items?.games?.name || "-"}</TableCell>
                                <TableCell>{item.is_available ? <StatusBadge variant="success">Tersedia</StatusBadge> : <StatusBadge variant="danger">Habis / Terjual</StatusBadge>}</TableCell>
                                <TableCell className="text-sm text-zinc-400">{item.stock_notes || "-"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <ActionIcon
                                            icon={Pencil}
                                            variant="edit"
                                            title="Edit Catatan"
                                            onClick={() => {
                                                setEditItemData(item);
                                                setNewNotes(item.stock_notes || "");
                                                setIsEditNotesOpen(true);
                                            }}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={item.is_available ? "h-8 w-8 text-zinc-500 hover:bg-red-500/10 hover:text-red-500" : "h-8 w-8 text-zinc-500 hover:bg-green-500/10 hover:text-green-500"}
                                            title={item.is_available ? "Tandai Habis" : "Tandai Tersedia"}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleItemStatus(item.id, item.is_available);
                                            }}
                                        >
                                            {item.is_available ? <PackageX className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                                        </Button>
                                        <ConfirmDialog
                                            trigger={<ActionIcon icon={Trash2} variant="delete" title="Hapus Item" />}
                                            title="Hapus Item dari Akun?"
                                            description={
                                                <>
                                                    Ini bakal menghapus item <strong>{item.items?.item_name}</strong> dari akun ini. Kalau ini item terakhir dari game tersebut di akun ini, gamenya juga otomatis ke-hapus dari akun ini. Lanjut?
                                                </>
                                            }
                                            onConfirm={() => handleRemoveItem(item.id, item.items?.game_id)}
                                        />
                                    </div>
                                </TableCell>
                            </ClickableTableRow>
                        )}
                    />
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}
