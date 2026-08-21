"use client";

import { Gamepad2, Link2, Pencil } from "lucide-react";
import { useCallback, useState } from "react";

import { PageHeader } from "@/components/molecules/PageHeader";
import { SearchBar } from "@/components/molecules/SearchBar";
import { GamePrivateServerDialog } from "@/components/organisms/GamePrivateServerDialog";
import { PageContainer } from "@/components/templates/PageContainer";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const { library } = useEldoradoLibrary();

    // Jumlah akun per game Eldorado, buat badge di kartu.
    const [accountCounts, setAccountCounts] = useState({});
    const [editingGame, setEditingGame] = useState(null);

    const fetchAccountCounts = useCallback(async () => {
        const { data } = await supabase.from("games").select("eldorado_game_id, account_games(id)").not("eldorado_game_id", "is", null);
        setAccountCounts(Object.fromEntries((data || []).map((g) => [g.eldorado_game_id, g.account_games?.length || 0])));
    }, []);

    useAuthGuard(fetchAccountCounts, []);

    const filteredEldoradoGames = Array.from(new Map((library || []).filter((g) => g.gameGroup?.toLowerCase() === "roblox" && (g.menuGameTitle || g.gameName || "").toLowerCase().includes(searchTerm.toLowerCase())).map((g) => [g.gameId, g])).values()).sort((a, b) => (a.menuGameTitle || a.gameName || "").localeCompare(b.menuGameTitle || b.gameName || ""));

    return (
        <PageContainer>
            <PageHeader
                title="Games"
                subtitle="Dapet dari eldo library"
                icon={Gamepad2}
                rightContent={
                    <div className="flex w-full flex-col items-center gap-4 md:flex-row">
                        <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nama game..." containerClassName="w-full md:w-64" />
                    </div>
                }
            />

            <div className="mt-6 w-full">
                {filteredEldoradoGames.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {filteredEldoradoGames.map((game, index) => (
                            <div key={`eldo-${game.gameId || "0"}-${index}`} className="group hover:border-primary/50 hover:shadow-primary/5 border-border bg-surface-2/50 hover:bg-surface-3/80 relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-lg" onClick={() => setEditingGame(game)}>
                                <button type="button" title="Edit private server link" onClick={() => setEditingGame(game)} className="hover:text-accent hover:border-accent/50 border-border/50 bg-surface-1/80 text-muted-foreground absolute top-2 right-2 rounded-md border p-1.5 opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100">
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <div className="border-border/50 bg-surface-3 text-muted-foreground flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border font-bold shadow-inner transition-transform group-hover:scale-105">
                                    <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${game.gameId}.png`} alt={game.menuGameTitle || game.gameName} className="h-full w-full object-cover" />
                                </div>
                                <div className="w-full text-center">
                                    <h3 className="group-hover:text-primary text-foreground line-clamp-2 text-sm font-bold transition-colors" title={game.menuGameTitle || game.gameName}>
                                        {game.menuGameTitle || game.gameName}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 font-mono text-xs">ID: {game.gameId}</p>
                                    {accountCounts[String(game.gameId)] > 0 && (
                                        <span className="text-primary border-primary/30 bg-primary/10 mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                                            <Link2 className="h-3 w-3" />
                                            {accountCounts[String(game.gameId)]} akun
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border-border bg-surface-2/30 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                        <Gamepad2 className="text-muted-foreground/70 mb-4 h-12 w-12" />
                        <h3 className="text-foreground text-base font-semibold">{searchTerm ? `Gak ada game yang cocok sama "${searchTerm}"` : "Library Eldorado belum kebaca"}</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{searchTerm ? "Coba potong kata kuncinya — nama game di Eldorado sering beda dari nama populernya." : "Pastiin extension sync-nya aktif dan lu masih login di eldorado.gg."}</p>
                    </div>
                )}
            </div>

            <GamePrivateServerDialog open={!!editingGame} onOpenChange={(open) => !open && setEditingGame(null)} game={editingGame} onSaved={fetchAccountCounts} />
        </PageContainer>
    );
}
