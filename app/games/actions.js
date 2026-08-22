"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { eldoradoIconUrl } from "@/lib/templateVars";

/**
 * Action buat dialog "Private Server Link" di halaman /games.
 *
 * Dialog ini kasus khusus: game-nya dateng dari library Eldorado, dan baris
 * `games` lokal-nya BARU DIBIKIN waktu link pertama disimpen. Jadi dia gak bisa
 * pakai pola /games/[id] yang mengasumsikan game-nya udah ada.
 *
 * Sebelumnya seluruh urutan ini (bikin game, hapus tautan, hapus stok item,
 * upsert link satu-satu) jalan dari browser lewat 5 panggilan supabase
 * terpisah. Sekarang satu action, satu kali cek auth.
 */

const DUPLICATE_CODE = "23505";

function isDuplicate(error) {
    return error?.code === DUPLICATE_CODE || error?.message?.includes("duplicate");
}

async function guard() {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };
    return { supabase: await createSupabaseServerClient() };
}

/**
 * Baca konfigurasi sekarang buat satu game Eldorado.
 *
 * Ini fungsi BACA yang jadi Server Action — biasanya gue hindarin, tapi di sini
 * memang perlu: pemanggilnya dialog di klien yang baru fetch waktu dibuka.
 * Nariknya di server buat SEMUA game sekaligus itu pemborosan besar (ratusan
 * game, padahal yang dibuka satu).
 */
export async function loadPrivateServerConfig(eldoradoGameId) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!eldoradoGameId) return { error: "ID game Eldorado gak ada." };

    const [{ data: accounts }, { data: game }] = await Promise.all([supabase.from("accounts").select("id, username").order("username"), supabase.from("games").select("id, name, requires_private_server").eq("eldorado_game_id", String(eldoradoGameId)).maybeSingle()]);

    let rows = [];

    if (game) {
        const { data: linked } = await supabase.from("account_games").select("id, account_id, private_server_link, accounts(username)").eq("game_id", game.id);

        rows = (linked ?? [])
            .map((row) => ({
                accountGameId: row.id,
                accountId: row.account_id,
                username: row.accounts?.username ?? "(akun kehapus)",
                link: row.private_server_link ?? "",
            }))
            .sort((a, b) => a.username.localeCompare(b.username));
    }

    return {
        allAccounts: accounts ?? [],
        game: game ?? null,
        rows,
    };
}

/**
 * Simpen semua perubahan dari dialog dalam satu panggilan.
 *
 * `rows`        = akun yang harus ada, beserta link-nya
 * `removedRows` = tautan yang dicabut (accountGameId + accountId)
 */
export async function savePrivateServerConfig({ eldoradoGameId, gameName, rows = [], removedRows = [] }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!eldoradoGameId) return { error: "ID game Eldorado gak ada." };

    // Link private server unique di DB. Dicek di sini juga, bukan cuma di
    // dialog — biar aturannya gak bisa dilewatin dengan nembak action langsung.
    const seen = new Set();
    for (const row of rows) {
        const link = row.link?.trim();
        if (!link) continue;
        if (seen.has(link)) return { error: `Link "${link}" kepakai di dua akun. Satu link cuma buat satu akun.` };
        seen.add(link);
    }

    // Baris `games` lokal belum ada -> bikin dari data library Eldorado.
    let { data: game } = await supabase.from("games").select("id, requires_private_server").eq("eldorado_game_id", String(eldoradoGameId)).maybeSingle();

    if (!game) {
        const { data: created, error } = await supabase
            .from("games")
            .insert([{ name: gameName, image_url: eldoradoIconUrl(eldoradoGameId), eldorado_game_id: String(eldoradoGameId), requires_private_server: false }])
            .select("id, requires_private_server")
            .single();

        if (error) return { error: `Gagal nyimpen game: ${error.message}` };
        game = created;
    }

    // Kalau game-nya diwajibin private server, semua baris harus punya link.
    if (game.requires_private_server) {
        const blank = rows.find((row) => !row.link?.trim());
        if (blank) return { error: `Game ini wajib private server, tapi ${blank.username} link-nya kosong.` };
    }

    const failures = [];

    // ── Cabut tautan yang dihapus, plus stok item game ini di akun tsb ──
    if (removedRows.length > 0) {
        const { error } = await supabase
            .from("account_games")
            .delete()
            .in(
                "id",
                removedRows.map((row) => row.accountGameId)
            );

        if (error) {
            failures.push(`hapus tautan: ${error.message}`);
        } else {
            const { data: gameItems } = await supabase.from("items").select("id").eq("game_id", game.id);

            if (gameItems?.length) {
                await supabase
                    .from("account_items")
                    .delete()
                    .in(
                        "account_id",
                        removedRows.map((row) => row.accountId)
                    )
                    .in(
                        "item_id",
                        gameItems.map((item) => item.id)
                    );
            }
        }
    }

    // ── Upsert link per akun ──
    for (const row of rows) {
        const link = row.link?.trim() || null;

        const { error } = row.accountGameId ? await supabase.from("account_games").update({ private_server_link: link }).eq("id", row.accountGameId) : await supabase.from("account_games").insert([{ game_id: game.id, account_id: row.accountId, private_server_link: link }]);

        if (error) {
            failures.push(`${row.username}: ${isDuplicate(error) ? "link udah dipakai di tempat lain" : error.message}`);
        }
    }

    revalidatePath("/games");
    revalidatePath(`/games/${game.id}`);
    revalidatePath("/accounts");

    if (failures.length > 0) {
        return { partial: true, error: failures.join(" · ") };
    }

    return { success: true };
}

/** Daftarin akun baru langsung dari kolom cari di dialog. */
export async function createAccountFromDialog(username) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    const trimmed = (username ?? "").trim();
    if (!trimmed) return { error: "Username-nya kosong." };

    const { data, error } = await supabase
        .from("accounts")
        .insert([{ username: trimmed }])
        .select("id, username")
        .single();

    if (error) return { error: isDuplicate(error) ? `Akun "${trimmed}" udah kedaftar.` : error.message };

    revalidatePath("/accounts");
    return { success: true, account: data };
}
