import "server-only";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Data halaman detail game. Bukan endpoint — dipanggil langsung dari RSC.
 *
 * Empat query paralel dalam satu request server, gantiin empat fetch berurutan
 * dari browser.
 */
export async function getGameDetail(gameId) {
    if (!gameId) return null;

    const supabase = await createSupabaseServerClient();

    const [gameResult, accountsResult, itemsResult, allAccountsResult] = await Promise.all([supabase.from("games").select("id, name, image_url, requires_private_server, eldorado_game_id").eq("id", gameId).maybeSingle(), supabase.from("account_games").select("id, account_id, private_server_link, created_at, accounts(id, username, status)").eq("game_id", gameId), supabase.from("items").select("id, item_name, description, created_at").eq("game_id", gameId), supabase.from("accounts").select("id, username, status").order("username")]);

    if (!gameResult.data) return null;

    const linkedAccounts = (accountsResult.data ?? []).slice().sort((a, b) => (a.accounts?.username ?? "").localeCompare(b.accounts?.username ?? ""));

    const items = (itemsResult.data ?? []).slice().sort((a, b) => (a.item_name ?? "").localeCompare(b.item_name ?? ""));

    return {
        game: gameResult.data,
        linkedAccounts,
        items,
        allAccounts: allAccountsResult.data ?? [],
        error: gameResult.error?.message ?? accountsResult.error?.message ?? itemsResult.error?.message ?? null,
    };
}
