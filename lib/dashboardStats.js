import "server-only";

import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Angka ringkas buat kartu statistik di dashboard.
 *
 * Semuanya pakai `head: true` + `count: "exact"` — jadi Postgres cuma ngitung,
 * gak ngirim barisnya. Empat hitungan ini beratnya setara satu query kecil,
 * bukan empat query yang narik data.
 */
export async function getDashboardStats() {
    if (!(await getCurrentAdmin())) return null;

    const supabase = await createSupabaseServerClient();

    const [accounts, emptyRobux, games, templates] = await Promise.all([supabase.from("accounts").select("*", { count: "exact", head: true }), supabase.from("accounts").select("*", { count: "exact", head: true }).eq("status", "EMPTY_ROBUX"), supabase.from("games").select("*", { count: "exact", head: true }), supabase.from("chat_templates").select("*", { count: "exact", head: true })]);

    const totalAccounts = accounts.count ?? 0;
    const outOfRobux = emptyRobux.count ?? 0;

    return {
        totalAccounts,
        // Yang siap dipakai, bukan cuma total. Total 13 akun gak ada artinya
        // kalau 11 di antaranya robux-nya habis.
        readyAccounts: Math.max(0, totalAccounts - outOfRobux),
        outOfRobux,
        totalGames: games.count ?? 0,
        totalTemplates: templates.count ?? 0,
    };
}
