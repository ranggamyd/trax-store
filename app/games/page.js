"use client";

import { Gamepad2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/molecules/PageHeader";
import { SearchBar } from "@/components/molecules/SearchBar";
import { PageContainer } from "@/components/templates/PageContainer";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function Dashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const { library } = useEldoradoLibrary();

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
                            <div key={`eldo-${game.gameId || "0"}-${index}`} className="group hover:border-primary/50 hover:shadow-primary/5 relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-800/80 hover:shadow-lg">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-800 font-bold text-zinc-400 shadow-inner transition-transform group-hover:scale-105">
                                    <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${game.gameId}.png`} alt={game.menuGameTitle || game.gameName} className="h-full w-full object-cover" />
                                </div>
                                <div className="w-full text-center">
                                    <h3 className="group-hover:text-primary line-clamp-2 text-sm font-bold text-white transition-colors" title={game.menuGameTitle || game.gameName}>
                                        {game.menuGameTitle || game.gameName}
                                    </h3>
                                    <p className="mt-1 font-mono text-xs text-zinc-500">ID: {game.gameId}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 py-16 text-center">
                        <Gamepad2 className="mb-4 h-12 w-12 text-zinc-600" />
                        <h3 className="text-lg font-bold text-white">Kosong</h3>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
