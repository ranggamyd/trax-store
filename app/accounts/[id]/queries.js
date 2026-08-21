import "server-only";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Data halaman detail akun. Bukan endpoint — dipanggil langsung dari RSC.
 *
 * Empat query jalan paralel dalam satu request server. Versi lama nembak
 * keempatnya dari browser SETELAH JS ke-load, hydrate, dan getSession() —
 * jadi halaman detail selalu nampilin skeleton dulu walau datanya kecil.
 */
export async function getAccountDetail(accountId) {
    if (!accountId) return null;

    const supabase = await createSupabaseServerClient();

    const [accountResult, gamesResult, itemsResult, allGamesResult] = await Promise.all([supabase.from("accounts").select("id, username, notes, status").eq("id", accountId).maybeSingle(), supabase.from("account_games").select("id, game_id, private_server_link, created_at, games(id, name, image_url, requires_private_server)").eq("account_id", accountId), supabase.from("account_items").select("id, is_available, stock_notes, items(id, item_name, game_id, games(name))").eq("account_id", accountId), supabase.from("games").select("id, name, requires_private_server, items(id, item_name)").order("name")]);

    // `.maybeSingle()` (bukan `.single()`): akun yang udah kehapus harus
    // ngasilin 404 yang rapi, bukan error yang naik ke error boundary.
    if (!accountResult.data) return null;

    const linkedGames = (gamesResult.data ?? []).slice().sort((a, b) => (a.games?.name ?? "").localeCompare(b.games?.name ?? ""));

    const linkedItems = (itemsResult.data ?? []).slice().sort((a, b) => (a.items?.item_name ?? "").localeCompare(b.items?.item_name ?? ""));

    return {
        account: accountResult.data,
        linkedGames,
        linkedItems,
        allGames: allGamesResult.data ?? [],
        error: accountResult.error?.message ?? gamesResult.error?.message ?? itemsResult.error?.message ?? null,
    };
}
