"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil,Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ActionIcon } from "@/components/atoms/ActionIcon";
import { CopyButton } from "@/components/CopyButton";
import { GlobalLoading } from "@/components/GlobalLoading";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { DetailHeader } from "@/components/molecules/DetailHeader";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { PrivateServerLinkCell } from "@/components/molecules/PrivateServerLinkCell";
import { DataTable } from "@/components/organisms/DataTable";
import { EditLinkDialog } from "@/components/organisms/EditLinkDialog";
import { GameFormDialog } from "@/components/organisms/GameFormDialog";
import { MissingLinksDialog } from "@/components/organisms/MissingLinksDialog";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { accountGameSchema, gameSchema, itemSchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import { isDuplicateError, processItemLinks,saveMissingLinks, validateUniqueItems } from "@/lib/supabaseHelpers";
import { getInitials } from "@/lib/utils";

export default function GameDetail() {
    const params = useParams();
    const router = useRouter();
    const [game, setGame] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [items, setItems] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("accounts");
    const [accountSearch, setAccountSearch] = useState("");
    const [itemSearch, setItemSearch] = useState("");

    // Add Account dialog state
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [accountItemsLinks, setAccountItemsLinks] = useState([]);

    // Add Item dialog state
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [editItemId, setEditItemId] = useState(null);
    const [itemAccounts, setItemAccounts] = useState([{ account_id: "", private_server_link: "" }]);

    // Edit link dialog state
    const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
    const [editAccountGame, setEditAccountGame] = useState(null);
    const [newLink, setNewLink] = useState("");

    // Edit game dialog state
    const [isEditGameOpen, setIsEditGameOpen] = useState(false);
    const [missingLinks, setMissingLinks] = useState([]);
    const [isMissingLinksOpen, setIsMissingLinksOpen] = useState(false);
    const [pendingGameData, setPendingGameData] = useState(null);

    const {
        register: regAcc,
        handleSubmit: handAcc,
        formState: { errors: errAcc },
        reset: resetAcc,
        watch: watchAcc,
        setValue: setValueAcc,
    } = useForm({ resolver: zodResolver(accountGameSchema) });
    const {
        register: regGame,
        handleSubmit: handGame,
        formState: { errors: errGame },
        reset: resetGame,
        watch: watchGame,
        setValue: setValueGame,
    } = useForm({ resolver: zodResolver(gameSchema) });
    const {
        register: regItem,
        handleSubmit: handItem,
        formState: { errors: errItem },
        reset: resetItem,
    } = useForm({ resolver: zodResolver(itemSchema) });

    const { session } = useAuthGuard(() => fetchData(true), [params.id]);

    // ─── Data Fetching ───
    const fetchData = async (showLoader = false) => {
        if (showLoader) setLoading(true);
        const [{ data: gameData }, { data: accountsData }, { data: itemsData }, { data: allAccData }] = await Promise.all([supabase.from("games").select("*").eq("id", params.id).single(), supabase.from("account_games").select("*, accounts(id, username, status)").eq("game_id", params.id), supabase.from("items").select("*").eq("game_id", params.id), supabase.from("accounts").select("*")]);
        setGame(gameData);
        setAccounts(accountsData || []);
        setItems(itemsData || []);
        setAllAccounts(allAccData || []);
        setLoading(false);
    };

    // ─── Filtered Lists ───
    const filteredAccounts = accounts.filter((acc) => acc.accounts?.username.toLowerCase().includes(accountSearch.toLowerCase()));
    const filteredItems = items.filter((item) => item.item_name.toLowerCase().includes(itemSearch.toLowerCase()) || (item.description && item.description.toLowerCase().includes(itemSearch.toLowerCase())));

    // ─── Add Account Handler ───
    const onAddAccount = async (data) => {
        if (game.requires_private_server && !data.private_server_link) {
            return toast.error("Wajib isi link!", {
                description: "Game ini wajib pake Private Server Link bro!",
            });
        }

        const validItems = accountItemsLinks.filter((lnk) => lnk.item_id !== "" || lnk.new_name !== "");
        if (!validateUniqueItems(validItems)) return;

        const { error } = await supabase.from("account_games").insert([
            {
                game_id: params.id,
                account_id: data.account_id,
                private_server_link: data.private_server_link?.trim() || null,
            },
        ]);

        if (error) {
            if (isDuplicateError(error)) {
                toast.error("Waduh, gagal nambah akun", {
                    description: error.message.includes("private_server_link") ? "Link Private Server ini udah dipakai di akun lain! Cari link yang beda bos." : "Akun ini udah ditautin ke game ini bro!",
                });
            } else {
                toast.error("Waduh, gagal nambah akun", { description: error.message });
            }
        } else {
            const processedCount = await processItemLinks(validItems, {
                gameId: params.id,
                accountId: data.account_id,
            });
            toast.success("Masuk pak eko!", {
                description: `Akun udah ditautin ke game ini${processedCount > 0 ? ` plus ${processedCount} item ditambahkan` : ""}.`,
            });
            resetAcc();
            setAccountItemsLinks([]);
            setIsAddAccountOpen(false);
            fetchData(false);
        }
    };

    // ─── Add/Edit Item Handler ───
    const onAddItem = async (data) => {
        if (editItemId) {
            const { error } = await supabase
                .from("items")
                .update({ item_name: data.item_name, description: data.description || null })
                .eq("id", editItemId);
            if (error) {
                toast.error("Waduh, gagal update item", { description: error.message });
            } else {
                toast.success("Item diupdate!", { description: "Data item berhasil diubah." });
                closeItemDialog();
                fetchData(false);
            }
        } else {
            const validAccounts = itemAccounts.filter((a) => a.account_id !== "");
            if (validAccounts.length === 0)
                return toast.error("Akun wajib diisi!", {
                    description: "Wajib pilih minimal 1 akun untuk nyimpen stok item ini.",
                });

            if (game?.requires_private_server) {
                for (const acc of validAccounts) {
                    if (!acc.private_server_link || acc.private_server_link.trim() === "") {
                        return toast.error("Ada link private server yang kosong!", {
                            description: "Game ini wajib private server, jadi semua akun yang dipilih wajib diisi linknya.",
                        });
                    }
                }
            }

            const uniqueAccounts = new Set(validAccounts.map((a) => a.account_id));
            if (uniqueAccounts.size !== validAccounts.length)
                return toast.error("Ada akun ganda bos!", {
                    description: "Gak boleh milih akun yang sama lebih dari sekali di baris yang beda.",
                });

            // Upsert account_games
            for (const acc of validAccounts) {
                const { data: existAccGame } = await supabase.from("account_games").select("id").eq("account_id", acc.account_id).eq("game_id", params.id).single();
                if (existAccGame) {
                    if (acc.private_server_link) {
                        const { error: updErr } = await supabase.from("account_games").update({ private_server_link: acc.private_server_link }).eq("id", existAccGame.id);
                        if (updErr && isDuplicateError(updErr))
                            return toast.error("Link Duplikat!", {
                                description: "Link private server udah dipake di tempat lain.",
                            });
                    }
                } else {
                    const { error: insErr } = await supabase.from("account_games").insert([
                        {
                            account_id: acc.account_id,
                            game_id: params.id,
                            private_server_link: acc.private_server_link || null,
                        },
                    ]);
                    if (insErr) {
                        if (isDuplicateError(insErr))
                            return toast.error("Link Duplikat!", {
                                description: "Link private server udah dipake di tempat lain.",
                            });
                        return toast.error("Gagal nyambungin akun ke game", { description: insErr.message });
                    }
                }
            }

            const { data: insertedItem, error } = await supabase
                .from("items")
                .insert([{ game_id: params.id, item_name: data.item_name, description: data.description || null }])
                .select()
                .single();
            if (error) {
                toast.error("Waduh, gagal nambah item", { description: error.message });
            } else {
                if (validAccounts.length > 0) {
                    const { error: accErr } = await supabase.from("account_items").insert(
                        validAccounts.map((acc) => ({
                            item_id: insertedItem.id,
                            account_id: acc.account_id,
                            is_available: true,
                        }))
                    );
                    toast[accErr ? "error" : "success"](accErr ? "Item terbuat, tapi gagal numpangin ke akun" : "Jos gandos!", { description: accErr ? accErr.message : "Item baru dan stok akunnya udah terdaftar." });
                } else {
                    toast.success("Jos gandos!", { description: "Item baru udah terdaftar." });
                }
                closeItemDialog();
                fetchData(false);
            }
        }
    };

    // ─── Game CRUD ───
    const onSubmitEditGame = async (data) => {
        if (data.requires_private_server) {
            const { data: missing } = await supabase.from("account_games").select("id, account_id, private_server_link, accounts(username)").eq("game_id", params.id).or('private_server_link.is.null,private_server_link.eq.""');
            if (missing?.length > 0) {
                setMissingLinks(missing);
                setPendingGameData(data);
                setIsMissingLinksOpen(true);
                return;
            }
        }
        const { error } = await supabase
            .from("games")
            .update({
                name: data.name,
                image_url: data.image_url,
                requires_private_server: data.requires_private_server,
            })
            .eq("id", params.id);
        if (error) {
            toast.error("Waduh, gagal update game", { description: error.message });
        } else {
            toast.success("Mantap!", { description: "Data game berhasil diubah." });
            setIsEditGameOpen(false);
            fetchData(false);
        }
    };

    const handleSaveMissingLinksSubmit = async (e) => {
        e.preventDefault();
        if (missingLinks.some((ml) => !ml.private_server_link || ml.private_server_link.trim() === "")) return toast.error("Semua link wajib diisi bos!");
        const { error } = await saveMissingLinks(missingLinks, params.id);
        if (error) return;
        const { error: gameError } = await supabase
            .from("games")
            .update({
                name: pendingGameData.name,
                image_url: pendingGameData.image_url,
                requires_private_server: pendingGameData.requires_private_server,
            })
            .eq("id", params.id);
        if (gameError) {
            toast.error("Waduh, gagal update game", { description: gameError.message });
        } else {
            toast.success("Mantap!", { description: "Data game dan link akun berhasil diupdate." });
            setIsMissingLinksOpen(false);
            setIsEditGameOpen(false);
            fetchData(false);
        }
    };

    const handleDeleteGame = async () => {
        const { error } = await supabase.from("games").delete().eq("id", game.id);
        if (error) {
            toast.error("Gagal hapus game", { description: error.message });
        } else {
            toast.success("Game dihapus!", { description: "Semua data terkait udah lenyap." });
            router.push("/games");
        }
    };

    // ─── Account Helpers ───
    const handleKickAccount = async (accountGameId, accountId) => {
        const { error } = await supabase.from("account_games").delete().eq("id", accountGameId);
        if (error) {
            toast.error("Gagal nendang", { description: error.message });
            return;
        }
        const { data: gameItems } = await supabase.from("items").select("id").eq("game_id", params.id);
        if (gameItems?.length > 0)
            await supabase
                .from("account_items")
                .delete()
                .eq("account_id", accountId)
                .in(
                    "item_id",
                    gameItems.map((i) => i.id)
                );
        toast.success("Ditendang!", {
            description: "Akun dan semua itemnya dari game ini udah dicabut.",
        });
        fetchData(false);
    };

    const handleUpdateLink = async (e) => {
        e.preventDefault();
        if (game.requires_private_server && !newLink.trim())
            return toast.error("Wajib isi link!", {
                description: "Game ini wajib pake Private Server Link bro!",
            });
        const { error } = await supabase
            .from("account_games")
            .update({ private_server_link: newLink.trim() || null })
            .eq("id", editAccountGame.id);
        if (error) {
            isDuplicateError(error)
                ? toast.error("Gagal update", {
                      description: "Link Private Server ini udah dipakai di tempat lain!",
                  })
                : toast.error("Gagal update", { description: error.message });
        } else {
            toast.success("Update sukses!", { description: "Link Private Server berhasil diubah." });
            setIsEditLinkOpen(false);
            fetchData(false);
        }
    };

    // ─── Item Helpers ───
    const closeItemDialog = () => {
        setIsAddItemOpen(false);
        setEditItemId(null);
        setItemAccounts([{ account_id: "", private_server_link: "" }]);
        resetItem({ item_name: "", description: "" });
    };
    const handleDeleteItem = async (itemId) => {
        const { error } = await supabase.from("items").delete().eq("id", itemId);
        if (error) {
            toast.error("Gagal hapus item", { description: error.message });
        } else {
            toast.success("Dihapus!");
            fetchData(false);
        }
    };

    // ─── Account Combobox Helpers ───
    const handleCreateAccountFromCombo = async (username, onSuccess) => {
        const { data, error } = await supabase.from("accounts").insert([{ username }]).select().single();
        if (error) {
            toast.error("Gagal bikin akun", { description: error.message });
            return;
        }
        toast.success("Akun baru berhasil didaftarin!");
        setAllAccounts([...allAccounts, data]);
        onSuccess(data);
    };

    if (loading && !game) return <GlobalLoading text="Loading data game..." />;
    if (!session) return <GlobalLoading text="Mengecek sesi..." />;

    return (
        <PageContainer>
            <DetailHeader
                title={game.name}
                subtitle={
                    <>
                        Status Private Server: {game.requires_private_server ? <span className="font-bold text-red-500">Wajib Join</span> : <span className="font-bold text-green-500">Bebas</span>}
                        <span className="ml-2 text-xs text-zinc-500">| Game ID: {game.id}</span>
                    </>
                }
                imageUrl={game.image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop"}
                avatarShape="xl"
                rightContent={
                    <>
                        <ActionIcon
                            icon={Pencil}
                            title="Edit Game"
                            variant="edit"
                            onClick={() => {
                                resetGame({
                                    name: game.name,
                                    image_url: game.image_url || "",
                                    requires_private_server: game.requires_private_server || false,
                                });
                                setIsEditGameOpen(true);
                            }}
                            className="h-10 w-10"
                        />
                        <ConfirmDialog trigger={<ActionIcon icon={Trash2} title="Hapus Game" variant="delete" className="h-10 w-10" />} title="Yakin mau hapus game ini?" description="Kalo dihapus, semua data item, dan daftar akun yang terhubung ke game ini bakal hilang permanen lho!" onConfirm={handleDeleteGame} />
                    </>
                }
            />

            <GameFormDialog open={isEditGameOpen} onOpenChange={setIsEditGameOpen} isEdit register={regGame} errors={errGame} watch={watchGame} setValue={setValueGame} onSubmit={handGame(onSubmitEditGame)} />
            <MissingLinksDialog open={isMissingLinksOpen} onOpenChange={setIsMissingLinksOpen} missingLinks={missingLinks} setMissingLinks={setMissingLinks} onSubmit={handleSaveMissingLinksSubmit} />
            <EditLinkDialog open={isEditLinkOpen} onOpenChange={setIsEditLinkOpen} entityLabel="Akun" entityName={editAccountGame?.accounts?.username} link={newLink} onLinkChange={setNewLink} onSubmit={handleUpdateLink} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-col">
                <TabsList className="mx-auto grid h-12 w-full max-w-md grid-cols-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
                    <TabsTrigger value="accounts" className="data-[state=active]:bg-primary rounded-lg transition-all data-[state=active]:font-bold data-[state=active]:text-white">
                        List Akun
                    </TabsTrigger>
                    <TabsTrigger value="items" className="data-[state=active]:bg-accent rounded-lg transition-all data-[state=active]:font-bold data-[state=active]:text-black">
                        List Item
                    </TabsTrigger>
                </TabsList>

                {/* ═══ ACCOUNTS TAB ═══ */}
                <TabsContent value="accounts" className="mt-6 space-y-4">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <h2 className="neon-text-primary text-xl font-bold">Akun yang main di sini</h2>
                        <div className="flex w-full items-center gap-2 md:w-auto">
                            <Input placeholder="Cari username..." value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} className="w-full border-zinc-800 bg-zinc-900 md:w-64" />
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/80 font-bold text-black"
                                onClick={() => {
                                    resetAcc();
                                    setAccountItemsLinks([]);
                                    setIsAddAccountOpen(true);
                                }}
                            >
                                <Plus className="mr-1 h-4 w-4" /> Tautkan Akun
                            </Button>
                        </div>
                    </div>

                    {/* Add Account Dialog */}
                    <FormDialog open={isAddAccountOpen} onOpenChange={(open) => (open ? setIsAddAccountOpen(true) : setIsAddAccountOpen(false))} title="Tautkan Akun ke Game" titleClassName="neon-text-primary">
                        <form onSubmit={handAcc(onAddAccount)} className="space-y-4 pt-4">
                            <div className="flex w-full flex-col space-y-2">
                                <Label>Pilih Akun</Label>
                                <ComboboxSelect
                                    items={allAccounts}
                                    value={watchAcc("account_id")}
                                    onSelect={(acc) => setValueAcc("account_id", acc.id)}
                                    getItemValue={(acc) => acc.username}
                                    placeholder="-- Pilih Akun Bro --"
                                    searchPlaceholder="Cari username akun..."
                                    emptyText="Akun gak ketemu bro."
                                    onCreateNew={(username) => handleCreateAccountFromCombo(username, (data) => setValueAcc("account_id", data.id))}
                                    createNewLabel={(term) => `Daftarin "${term}"`}
                                    renderItem={(acc) => (
                                        <>
                                            {acc.username}
                                            {acc.status === "EMPTY_ROBUX" && <span className="ml-2 inline-flex items-center rounded-sm border border-red-900 bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-500">HABIS</span>}
                                        </>
                                    )}
                                />
                                {errAcc.account_id && <p className="text-sm text-red-500">{errAcc.account_id.message}</p>}
                            </div>
                            <FormField label={<>Private Server Link {game.requires_private_server ? <span className="text-red-500">* (Wajib)</span> : "(Opsional)"}</>} error={errAcc.private_server_link?.message} register={regAcc("private_server_link")} placeholder="https://..." />

                            {/* Item links repeater */}
                            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
                                <div className="flex items-center justify-between">
                                    <Label>Item yang Dimiliki (Opsional)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setAccountItemsLinks([...accountItemsLinks, { item_id: "", new_name: "" }])} className="border-primary text-primary hover:bg-primary/20 h-7 text-xs">
                                        <Plus className="mr-1 h-3 w-3" /> Tambah Item
                                    </Button>
                                </div>
                                {accountItemsLinks.map((lnkObj, idx) => (
                                    <div key={idx} className="mt-2 flex items-center gap-2">
                                        <ComboboxSelect
                                            items={items}
                                            value={lnkObj.item_id}
                                            onSelect={(itm) => {
                                                const newArr = [...accountItemsLinks];
                                                newArr[idx] = { item_id: itm.id, new_name: "" };
                                                setAccountItemsLinks(newArr);
                                            }}
                                            getItemValue={(itm) => itm.item_name}
                                            placeholder={lnkObj.new_name ? `Item Baru: ${lnkObj.new_name}` : "-- Pilih Item --"}
                                            searchPlaceholder="Cari item..."
                                            emptyText="Gak ada item itu bro."
                                            onCreateNew={(name) => {
                                                const newArr = [...accountItemsLinks];
                                                newArr[idx] = { item_id: "", new_name: name };
                                                setAccountItemsLinks(newArr);
                                            }}
                                            createNewLabel={(term) => `Tambah item "${term}"`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 shrink-0 text-red-500 hover:bg-red-950 hover:text-red-400"
                                            onClick={() => {
                                                const newArr = [...accountItemsLinks];
                                                newArr.splice(idx, 1);
                                                setAccountItemsLinks(newArr);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button type="submit" className="bg-primary mt-4 w-full font-bold text-black">
                                Gass Tautkan
                            </Button>
                        </form>
                    </FormDialog>

                    <DataTable
                        loading={loading}
                        data={filteredAccounts}
                        emptyMessage={accounts.length === 0 ? "Belum ada akun nyangkut di game ini bro." : `Gak nemu akun dengan nama "${accountSearch}".`}
                        columns={[{ label: "Nama Akun" }, { label: "Link Server" }, { label: "Aksi", className: "text-right" }]}
                        renderRow={(acc) => (
                            <ClickableTableRow key={acc.id} href={`/accounts/${acc.account_id}`}>
                                <TableCell className="flex items-center gap-3 font-medium">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner">{getInitials(acc.accounts?.username)}</div>
                                    <div className="flex items-center gap-2">
                                        {acc.accounts?.username} <CopyButton textToCopy={acc.accounts?.username} className="h-6 w-6" />
                                        {acc.accounts?.status === "EMPTY_ROBUX" && <span className="inline-flex items-center rounded-sm border border-red-900 bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-500">HABIS ROBUX</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <PrivateServerLinkCell link={acc.private_server_link} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <ActionIcon
                                            icon={Pencil}
                                            variant="edit"
                                            title="Edit Link"
                                            onClick={() => {
                                                setEditAccountGame(acc);
                                                setNewLink(acc.private_server_link || "");
                                                setIsEditLinkOpen(true);
                                            }}
                                        />
                                        <ConfirmDialog trigger={<ActionIcon icon={Trash2} variant="delete" title="Tendang Akun" />} title="Yakin mau tendang akun ini?" description="Akun ini gak bakal nge-link sama game ini lagi, dan semua stok item dari game ini di akun tersebut bakal ikut kehapus." onConfirm={() => handleKickAccount(acc.id, acc.account_id)} confirmText="Tendang!" cancelText="Gak Jadi" />
                                    </div>
                                </TableCell>
                            </ClickableTableRow>
                        )}
                    />
                </TabsContent>

                {/* ═══ ITEMS TAB ═══ */}
                <TabsContent value="items" className="mt-6 space-y-4">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <h2 className="neon-text-accent text-xl font-bold">Daftar Item Game</h2>
                        <div className="flex w-full items-center gap-2 md:w-auto">
                            <Input placeholder="Cari nama item..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} className="w-full border-zinc-800 bg-zinc-900 md:w-64" />
                            <Button
                                size="sm"
                                className="bg-accent hover:bg-accent/80 font-bold text-black"
                                onClick={() => {
                                    setEditItemId(null);
                                    resetItem({ item_name: "", description: "" });
                                    setItemAccounts([{ account_id: "", private_server_link: "" }]);
                                    setIsAddItemOpen(true);
                                }}
                            >
                                <Plus className="mr-1 h-4 w-4" /> Tambah Item
                            </Button>
                        </div>
                    </div>

                    {/* Add/Edit Item Dialog */}
                    <FormDialog open={isAddItemOpen} onOpenChange={(open) => (open ? setIsAddItemOpen(true) : closeItemDialog())} title={editItemId ? "Edit Item" : "Tambah Item Baru"} titleClassName="neon-text-accent">
                        <form onSubmit={handItem(onAddItem)} className="space-y-4 pt-4">
                            <FormField label="Nama Item" error={errItem.item_name?.message} register={regItem("item_name")} placeholder="Cth: Dark Blade" />
                            <FormField label="Deskripsi (Opsional)" error={errItem.description?.message} register={regItem("description")} placeholder="Cth: Buah langka" />

                            {!editItemId && (
                                <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Tautkan ke Akun (Wajib minimal 1)</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setItemAccounts([...itemAccounts, { account_id: "", private_server_link: "" }])} className="border-primary text-primary hover:bg-primary/20 h-7 text-xs">
                                            <Plus className="mr-1 h-3 w-3" /> Tambah Akun
                                        </Button>
                                    </div>
                                    {itemAccounts.map((accObj, idx) => (
                                        <div key={idx} className="mt-2 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <ComboboxSelect
                                                    items={allAccounts}
                                                    value={accObj.account_id}
                                                    onSelect={async (acc) => {
                                                        const newArr = [...itemAccounts];
                                                        newArr[idx].account_id = acc.id;
                                                        if (game?.requires_private_server) {
                                                            const { data: linkData } = await supabase.from("account_games").select("private_server_link").eq("account_id", acc.id).eq("game_id", params.id).single();
                                                            newArr[idx].private_server_link = linkData?.private_server_link || "";
                                                        }
                                                        setItemAccounts(newArr);
                                                    }}
                                                    getItemValue={(acc) => acc.username}
                                                    placeholder="-- Pilih Akun --"
                                                    searchPlaceholder="Cari username akun..."
                                                    emptyText="Akun gak ketemu bro."
                                                    onCreateNew={(username) =>
                                                        handleCreateAccountFromCombo(username, (data) => {
                                                            const newArr = [...itemAccounts];
                                                            newArr[idx].account_id = data.id;
                                                            if (game?.requires_private_server) newArr[idx].private_server_link = "";
                                                            setItemAccounts(newArr);
                                                        })
                                                    }
                                                    createNewLabel={(term) => `Daftarin "${term}"`}
                                                    renderItem={(acc) => (
                                                        <>
                                                            {acc.username}
                                                            {acc.status === "EMPTY_ROBUX" && <span className="ml-2 inline-flex items-center rounded-sm border border-red-900 bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-500">HABIS</span>}
                                                        </>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0 text-red-500 hover:bg-red-950 hover:text-red-400"
                                                    onClick={() => {
                                                        const newArr = [...itemAccounts];
                                                        newArr.splice(idx, 1);
                                                        setItemAccounts(newArr);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {game?.requires_private_server && accObj.account_id && (
                                                <div className="mb-2 ml-1 flex w-full items-center border-l-2 border-zinc-800 pl-4">
                                                    <Input
                                                        placeholder="Link Private Server (Wajib)"
                                                        value={accObj.private_server_link}
                                                        onChange={(e) => {
                                                            const newArr = [...itemAccounts];
                                                            newArr[idx].private_server_link = e.target.value;
                                                            setItemAccounts(newArr);
                                                        }}
                                                        className="h-8 border-zinc-800 bg-zinc-900 text-xs"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button type="submit" className="bg-accent w-full font-bold text-black">
                                Gass Simpan
                            </Button>
                        </form>
                    </FormDialog>

                    <DataTable
                        loading={loading}
                        data={filteredItems}
                        emptyMessage={items.length === 0 ? "Belum ada item di game ini." : `Gak nemu item dengan nama "${itemSearch}".`}
                        columns={[{ label: "Nama Item" }, { label: "Deskripsi" }, { label: "Aksi", className: "text-right" }]}
                        renderRow={(item) => (
                            <ClickableTableRow key={item.id} href={`/items/${item.id}`}>
                                <TableCell className="flex items-center gap-3 font-medium">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner">{getInitials(item.item_name)}</div>
                                    <div className="flex items-center gap-2">
                                        {item.item_name} <CopyButton textToCopy={item.item_name} className="h-6 w-6" />
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-400">{item.description || "-"}</TableCell>
                                <TableCell className="flex items-center justify-end gap-1 text-right">
                                    <ActionIcon
                                        icon={Pencil}
                                        variant="edit"
                                        title="Edit Item"
                                        onClick={() => {
                                            setEditItemId(item.id);
                                            resetItem({ item_name: item.item_name, description: item.description || "" });
                                            setIsAddItemOpen(true);
                                        }}
                                    />
                                    <ConfirmDialog trigger={<ActionIcon icon={Trash2} variant="delete" title="Hapus Item" />} title="Yakin mau hapus item ini?" description={`Kalau item "${item.item_name}" dihapus, data stok di semua akun yang nyimpen item ini juga bakal ilang selamanya loh bos.`} onConfirm={() => handleDeleteItem(item.id)} confirmText="Ya, Hapus Aja" />
                                </TableCell>
                            </ClickableTableRow>
                        )}
                    />
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}
