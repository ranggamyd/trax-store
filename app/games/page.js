"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gameSchema } from "@/lib/schemas";
import { saveMissingLinks } from "@/lib/supabaseHelpers";
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
import { GameFormDialog } from "@/components/organisms/GameFormDialog";
import { MissingLinksDialog } from "@/components/organisms/MissingLinksDialog";
import { Plus, Gamepad2, Pencil, Trash2, Eye } from "lucide-react";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";

export default function Dashboard() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editGameId, setEditGameId] = useState(null);
    const [missingLinks, setMissingLinks] = useState([]);
    const [isMissingLinksOpen, setIsMissingLinksOpen] = useState(false);
    const [pendingGameData, setPendingGameData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { library } = useEldoradoLibrary();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm({
        resolver: zodResolver(gameSchema),
    });

    const fetchGames = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false });

        if (error) {
            toast.error("Gagal narik data game", { description: error.message });
        } else {
            setGames(data || []);
        }
        setLoading(false);
    };

    const { session } = useAuthGuard(() => fetchGames());

    const onSubmit = async (data) => {
        if (editGameId) {
            if (data.requires_private_server) {
                const { data: accountsWithMissingLinks } = await supabase.from("account_games").select("id, account_id, private_server_link, accounts(username)").eq("game_id", editGameId).or('private_server_link.is.null,private_server_link.eq.""');

                if (accountsWithMissingLinks?.length > 0) {
                    setMissingLinks(accountsWithMissingLinks);
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
                .eq("id", editGameId);

            if (error) {
                toast.error("Waduh, gagal update game", { description: error.message });
            } else {
                toast.success("Mantap!", { description: "Data game berhasil diubah." });
                closeDialog();
                fetchGames();
            }
        } else {
            const { error } = await supabase.from("games").insert([
                {
                    name: data.name,
                    image_url: data.image_url,
                    requires_private_server: data.requires_private_server,
                },
            ]);

            if (error) {
                toast.error("Waduh, gagal nambah game", { description: error.message });
            } else {
                toast.success("Mantap!", { description: "Game baru udah nongol di katalog." });
                closeDialog();
                fetchGames();
            }
        }
    };

    const handleSaveMissingLinksSubmit = async (e) => {
        e.preventDefault();
        if (missingLinks.some((ml) => !ml.private_server_link || ml.private_server_link.trim() === "")) {
            return toast.error("Semua link wajib diisi bos!");
        }

        const { error } = await saveMissingLinks(missingLinks, editGameId);
        if (error) return;

        const { error: gameError } = await supabase
            .from("games")
            .update({
                name: pendingGameData.name,
                image_url: pendingGameData.image_url,
                requires_private_server: pendingGameData.requires_private_server,
            })
            .eq("id", editGameId);

        if (gameError) {
            toast.error("Waduh, gagal update game", { description: gameError.message });
        } else {
            toast.success("Mantap!", { description: "Data game dan link akun berhasil diupdate." });
            setIsMissingLinksOpen(false);
            closeDialog();
            fetchGames();
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditGameId(null);
        reset({ name: "", image_url: "", requires_private_server: false });
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from("games").delete().eq("id", id);
        if (error) {
            toast.error("Gagal hapus bro", { description: error.message });
        } else {
            toast.success("Dibuang!", { description: "Game udah lenyap dari muka bumi." });
            fetchGames();
        }
    };

    if (loading && !games.length) return <GlobalLoading text="Lagi loading markas..." />;
    if (!session) return <GlobalLoading text="Mengecek sesi..." />;

    const filteredGames = games.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredEldoradoGames = Array.from(new Map((library || []).filter((g) => g.gameGroup?.toLowerCase() === "roblox" && (g.menuGameTitle || g.gameName || "").toLowerCase().includes(searchTerm.toLowerCase())).map((g) => [g.gameId, g])).values()).sort((a, b) => (a.menuGameTitle || a.gameName || "").localeCompare(b.menuGameTitle || b.gameName || ""));

    return (
        <PageContainer>
            <PageHeader
                title="Markas Besar"
                subtitle="Atur semua katalog game Traxstore dari sini bro."
                icon={Gamepad2}
                rightContent={
                    <div className="flex w-full flex-col items-center gap-4 md:flex-row">
                        <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari judul game..." containerClassName="w-full md:w-64" />
                        <Button
                            className="bg-primary hover:bg-primary/80 font-bold whitespace-nowrap text-black"
                            onClick={() => {
                                setEditGameId(null);
                                reset({ name: "", image_url: "", requires_private_server: false });
                                setIsDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Tambah Game
                        </Button>
                    </div>
                }
            />

            <GameFormDialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())} isEdit={!!editGameId} register={register} errors={errors} watch={watch} setValue={setValue} onSubmit={handleSubmit(onSubmit)} />

            <MissingLinksDialog open={isMissingLinksOpen} onOpenChange={setIsMissingLinksOpen} missingLinks={missingLinks} setMissingLinks={setMissingLinks} onSubmit={handleSaveMissingLinksSubmit} />

            <div className="w-full">
                <Tabs defaultValue="local" className="w-full">
                    <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 bg-zinc-900/50 p-1 backdrop-blur-md">
                        <TabsTrigger value="local" className="data-[state=active]:text-primary rounded-lg font-bold transition-all data-[state=active]:bg-zinc-800">
                            My Games (Local)
                        </TabsTrigger>
                        <TabsTrigger value="eldorado" className="data-[state=active]:text-primary rounded-lg font-bold transition-all data-[state=active]:bg-zinc-800">
                            Eldorado Library
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="local" className="m-0 border-none p-0 outline-none">
                        <DataTable
                            loading={loading}
                            data={filteredGames}
                            emptyMessage="Game belom ada atau gak ketemu bro."
                            columns={[{ label: "Nama Game" }, { label: "Opsi Join" }, { label: "Aksi", className: "text-right" }]}
                            renderRow={(game) => (
                                <ClickableTableRow key={game.id} href={`/games/${game.id}`} className="group">
                                    <TableCell className="flex items-center gap-3 font-medium">
                                        <div className="group-hover:border-primary/50 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner transition-colors">{game.image_url ? <Image unoptimized src={game.image_url} alt={game.name} width={40} height={40} className="h-full w-full object-cover" /> : <Gamepad2 className="h-5 w-5" />}</div>
                                        <span className="group-hover:text-primary text-base font-bold text-white transition-colors">{game.name}</span>
                                    </TableCell>
                                    <TableCell>{game.requires_private_server ? <StatusBadge variant="accent">Wajib Private Server</StatusBadge> : <StatusBadge variant="default">Public / Bebas</StatusBadge>}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/games/${game.id}`}>
                                                <ActionIcon icon={Eye} title="Detail Game" onClick={(e) => e.stopPropagation()} />
                                            </Link>
                                            <ActionIcon
                                                icon={Pencil}
                                                title="Edit Game"
                                                variant="edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditGameId(game.id);
                                                    reset({
                                                        name: game.name,
                                                        image_url: game.image_url || "",
                                                        requires_private_server: game.requires_private_server || false,
                                                    });
                                                    setIsDialogOpen(true);
                                                }}
                                            />
                                            <ConfirmDialog trigger={<ActionIcon icon={Trash2} title="Hapus Game" variant="delete" />} title="Yakin mau hapus game ini?" description="Semua item dan kaitan akun di game ini bakal ikut kehapus permanen loh." onConfirm={() => handleDelete(game.id)} confirmText="Hapus!" cancelText="Gak Jadi" />
                                        </div>
                                    </TableCell>
                                </ClickableTableRow>
                            )}
                        />
                    </TabsContent>

                    <TabsContent value="eldorado" className="m-0 border-none p-0 outline-none">
                        <DataTable
                            loading={loading}
                            data={filteredEldoradoGames}
                            emptyMessage="Game dari eldorado gak ketemu bro."
                            columns={[{ label: "Game ID", className: "w-[150px]" }, { label: "Nama Game" }]}
                            renderRow={(game, index) => (
                                <ClickableTableRow key={`eldo-${game.gameId || "0"}-${index}`} href="#" className="group cursor-default">
                                    <TableCell className="font-mono text-zinc-400">{game.gameId}</TableCell>
                                    <TableCell className="flex items-center gap-3 font-medium">
                                        <div className="group-hover:border-primary/50 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-800/80 font-bold text-zinc-400 shadow-inner transition-colors">
                                            <Image unoptimized src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${game.gameId}.png`} alt={game.menuGameTitle || game.gameName} width={40} height={40} className="h-full w-full object-cover" />
                                        </div>
                                        <span className="group-hover:text-primary text-base font-bold text-white transition-colors">{game.menuGameTitle || game.gameName}</span>
                                    </TableCell>
                                </ClickableTableRow>
                            )}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </PageContainer>
    );
}
