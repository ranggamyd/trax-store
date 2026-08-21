"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GamePrivateServerDialog } from "@/components/organisms/GamePrivateServerDialog";

/**
 * Nyetir GamePrivateServerDialog dari URL (?game=<eldoradoGameId>).
 *
 * Manfaat konkretnya di halaman ini: grid game-nya jadi bisa dirender PENUH di
 * server. Kalau state dialog ditaro di useState, seluruh grid harus jadi client
 * component cuma karena satu kartunya bisa diklik.
 *
 * Kartunya sekarang <Link href="?game=..."> biasa — jadi bisa dibuka di tab
 * baru, dan link ke satu game bisa dikirim ke orang lain.
 */
export function GameLinkDialog({ games }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const selectedId = searchParams.get("game");
    const game = selectedId ? (games.find((g) => String(g.gameId) === selectedId) ?? null) : null;

    const close = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("game");

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return (
        <GamePrivateServerDialog
            open={Boolean(game)}
            onOpenChange={(next) => !next && close()}
            game={game}
            // Dialog-nya nyimpen lewat browser client, jadi cache server perlu
            // dibilangin. router.refresh() nge-render ulang RSC-nya, dan badge
            // jumlah akun di grid ikut ke-update.
            onSaved={() => router.refresh()}
        />
    );
}
