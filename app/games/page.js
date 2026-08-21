import { Gamepad2, Link2, Pencil } from "lucide-react";
import Link from "next/link";

import { GameLinkDialog } from "@/app/games/components/GameLinkDialog";
import { getGamesPageData } from "@/app/games/queries";
import { PageHeader } from "@/components/molecules/PageHeader";
import { UrlSearchBar } from "@/components/molecules/UrlSearchBar";
import { PageContainer } from "@/components/templates/PageContainer";

export const metadata = {
    title: "Games",
};

/**
 * SERVER COMPONENT.
 *
 * Grid-nya dirender penuh di server. Yang jadi client cuma dua: kolom cari
 * (UrlSearchBar) dan dialog private server. Kartunya <Link> biasa, jadi bisa
 * dibuka di tab baru dan bisa di-prefetch Next.
 */
export default async function GamesPage({ searchParams }) {
    const params = await searchParams;
    const query = typeof params?.q === "string" ? params.q : "";

    const { games, total, error } = await getGamesPageData({ query });
    const isSearching = query.length > 0;

    return (
        <PageContainer width="wide">
            <PageHeader title="Games" eyebrow="Library Eldorado" subtitle={total > 0 ? `${total} game Roblox kebaca dari Eldorado.` : "Daftarnya dateng langsung dari Eldorado."} icon={Gamepad2} rightContent={<UrlSearchBar placeholder="Cari nama game..." containerClassName="w-full sm:w-72" />} />

            {error && (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-2xl border p-4 text-sm" role="alert">
                    {error} — pastiin extension sync-nya aktif dan lu masih login di eldorado.gg.
                </div>
            )}

            {games.length === 0 ? (
                <div className="border-border bg-surface-2/30 flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
                    <Gamepad2 className="text-muted-foreground/70 mb-4 h-12 w-12" />
                    <p className="text-foreground text-base font-semibold">{isSearching ? `Gak ada game yang cocok sama "${query}"` : "Library Eldorado belum kebaca"}</p>
                    <p className="text-muted-foreground mt-1 max-w-sm text-sm">{isSearching ? "Coba potong kata kuncinya — nama game di Eldorado sering beda dari nama populernya." : "Pastiin extension sync-nya aktif dan lu masih login di eldorado.gg."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {games.map((game) => (
                        <Link key={game.gameId} href={`/games?${new URLSearchParams({ ...(query ? { q: query } : {}), game: String(game.gameId) })}`} scroll={false} className="group glass-subtle hover:border-primary/40 relative flex flex-col items-center gap-3 rounded-2xl p-4 transition-colors">
                            <span className="border-border bg-surface-1/80 text-muted-foreground group-hover:text-accent group-hover:border-accent/40 absolute top-2 right-2 rounded-md border p-1.5 transition-all md:opacity-0 md:group-hover:opacity-100" title="Atur akun & private server">
                                <Pencil className="h-3.5 w-3.5" />
                            </span>

                            <div className="border-border bg-surface-3 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-transform group-hover:scale-105">
                                {/* Host gambarnya CDN Eldorado — next/image butuh allowlist domain, jadi <img> biasa dulu. */}
                                <img src={game.iconUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                            </div>

                            <div className="w-full text-center">
                                <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-sm font-semibold transition-colors" title={game.name}>
                                    {game.name}
                                </h3>
                                <p className="text-muted-foreground mt-1 font-mono text-[10px]">ID {game.gameId}</p>

                                {game.accountCount > 0 && (
                                    <span className="text-primary border-primary/25 bg-primary/10 mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                                        <Link2 className="h-3 w-3" />
                                        {game.accountCount} akun
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <GameLinkDialog games={games} />
        </PageContainer>
    );
}
