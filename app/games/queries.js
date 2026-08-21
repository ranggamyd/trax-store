import "server-only";

import { getEldoradoLibrary } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { eldoradoIconUrl } from "@/lib/templateVars";

/**
 * Daftar game Roblox dari Eldorado library + jumlah akun yang ketaut per game.
 *
 * Sebelumnya library-nya dateng dari `EldoradoLibraryContext` (fetch di browser)
 * dan jumlah akunnya dari query klien di useEffect. Dua request itu balapan:
 * grid-nya sempat kosong, terus muncul tanpa badge, baru badge-nya nyusul.
 * Sekarang dua-duanya kelar di server sebelum HTML dikirim.
 */
export async function getGamesPageData({ query = "" } = {}) {
    const supabase = await createSupabaseServerClient();

    const [libraryResult, countsResult] = await Promise.all([getEldoradoLibrary(), supabase.from("games").select("eldorado_game_id, account_games(id)").not("eldorado_game_id", "is", null)]);

    if (!libraryResult?.success) {
        return { games: [], total: 0, error: libraryResult?.error ?? "Library Eldorado gak kebaca." };
    }

    const accountCounts = Object.fromEntries((countsResult.data ?? []).map((row) => [String(row.eldorado_game_id), row.account_games?.length ?? 0]));

    const needle = query.trim().toLowerCase();

    // Library Eldorado bisa ngirim entri ganda buat gameId yang sama (beda
    // legacyUrlId), jadi di-dedupe pakai Map sebelum diurut.
    const deduped = new Map();

    for (const entry of libraryResult.data ?? []) {
        if (entry.gameGroup?.toLowerCase() !== "roblox") continue;

        const name = entry.menuGameTitle || entry.gameName || "";
        if (needle && !name.toLowerCase().includes(needle)) continue;
        if (!entry.gameId) continue;

        deduped.set(entry.gameId, {
            gameId: entry.gameId,
            // Dua field ini dipertahanin apa adanya karena GamePrivateServerDialog
            // baca `menuGameTitle`/`gameName` langsung dari objek ini.
            menuGameTitle: entry.menuGameTitle ?? null,
            gameName: entry.gameName ?? null,
            name,
            iconUrl: eldoradoIconUrl(entry.gameId),
            accountCount: accountCounts[String(entry.gameId)] ?? 0,
        });
    }

    const games = [...deduped.values()].sort((a, b) => a.name.localeCompare(b.name));

    return { games, total: games.length, error: null };
}
