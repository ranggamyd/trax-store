"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Mutasi di halaman detail akun.
 *
 * SEMUANYA sebelumnya jalan lewat browser client langsung dari komponen —
 * sepuluh operasi tulis (tautin game, tambah item, hapus, ubah link, ubah
 * catatan, toggle stok) yang cuma dijaga RLS. Sekarang lewat Server Action
 * yang tiap satunya dicek `getCurrentAdmin()` dulu, dan RLS jadi lapis kedua
 * bukan satu-satunya.
 *
 * Bonus: semua toast "gagal" yang dulu ditulis per-handler di komponen jadi
 * satu bentuk balikan `{ error }`, jadi UI-nya gak perlu tau bentuk error
 * Supabase.
 */

const DUPLICATE_CODE = "23505";

function isDuplicate(error) {
    return error?.code === DUPLICATE_CODE || error?.message?.includes("duplicate");
}

/** Cek auth + siapin client. Dipakai di awal tiap action. */
async function guard() {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };
    return { supabase: await createSupabaseServerClient() };
}

function revalidateAccount(accountId) {
    revalidatePath(`/accounts/${accountId}`);
    revalidatePath("/accounts");
}

/* ─────────────────────────── Game ↔ Akun ─────────────────────────── */

/**
 * Tautin game ke akun, sekaligus (opsional) tambahin beberapa item.
 *
 * `items` bentuknya [{ itemId } | { newName }]. Item baru dibikin kalau belum
 * ada di game itu — dicek pakai ilike biar "Dominus" dan "dominus" gak jadi
 * dua baris beda.
 */
export async function linkGameToAccount({ accountId, gameId, privateServerLink = "", items = [] }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    if (!accountId || !gameId) return { error: "Akun atau game-nya belum dipilih." };

    const { data: game } = await supabase.from("games").select("id, name, requires_private_server").eq("id", gameId).maybeSingle();
    if (!game) return { error: "Game-nya udah gak ada." };

    const link = privateServerLink.trim();
    if (game.requires_private_server && !link) {
        return { error: `"${game.name}" wajib punya link private server.` };
    }

    // Cek item ganda di server. Versi lama ngecek ini di klien pakai
    // validateUniqueItems() yang langsung manggil toast — jadi aturannya gak
    // berlaku kalau action-nya ditembak langsung.
    const seenIds = new Set();
    const seenNames = new Set();
    for (const item of items) {
        if (item.itemId) {
            if (seenIds.has(item.itemId)) return { error: "Ada item yang dipilih dua kali." };
            seenIds.add(item.itemId);
        }
        if (item.newName) {
            const key = item.newName.trim().toLowerCase();
            if (!key) continue;
            if (seenNames.has(key)) return { error: "Ada nama item baru yang kembar." };
            seenNames.add(key);
        }
    }

    const { data: existing } = await supabase.from("account_games").select("id").eq("account_id", accountId).eq("game_id", gameId).maybeSingle();

    if (existing) {
        if (link) {
            const { error } = await supabase.from("account_games").update({ private_server_link: link }).eq("id", existing.id);
            if (error) return { error: isDuplicate(error) ? "Link private server itu udah dipakai di tempat lain." : error.message };
        }
    } else {
        const { error } = await supabase.from("account_games").insert([{ account_id: accountId, game_id: gameId, private_server_link: link || null }]);
        if (error) return { error: isDuplicate(error) ? "Link private server itu udah dipakai di tempat lain." : error.message };
    }

    let added = 0;

    for (const item of items) {
        let itemId = item.itemId ?? null;

        if (!itemId && item.newName?.trim()) {
            const name = item.newName.trim();
            const { data: found } = await supabase.from("items").select("id").eq("game_id", gameId).ilike("item_name", name).maybeSingle();

            if (found) {
                itemId = found.id;
            } else {
                const { data: created } = await supabase
                    .from("items")
                    .insert([{ game_id: gameId, item_name: name }])
                    .select("id")
                    .single();
                itemId = created?.id ?? null;
            }
        }

        if (!itemId) continue;

        // Skip yang udah ketaut, biar gak error duplikat di tengah batch.
        const { data: alreadyLinked } = await supabase.from("account_items").select("id").eq("account_id", accountId).eq("item_id", itemId).maybeSingle();
        if (alreadyLinked) continue;

        const { error } = await supabase.from("account_items").insert([{ item_id: itemId, account_id: accountId, is_available: true }]);
        if (!error) added += 1;
    }

    revalidateAccount(accountId);
    return { success: true, gameName: game.name, itemsAdded: added };
}

/** Lepas game dari akun, plus semua item game itu yang nempel di akun ini. */
export async function unlinkGameFromAccount({ accountId, gameId }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    if (!accountId || !gameId) return { error: "Akun atau game-nya gak jelas." };

    const { data: gameItems } = await supabase.from("items").select("id").eq("game_id", gameId);

    if (gameItems?.length) {
        await supabase
            .from("account_items")
            .delete()
            .eq("account_id", accountId)
            .in(
                "item_id",
                gameItems.map((item) => item.id)
            );
    }

    const { error } = await supabase.from("account_games").delete().eq("account_id", accountId).eq("game_id", gameId);
    if (error) return { error: error.message };

    revalidateAccount(accountId);
    return { success: true };
}

/** Ubah link private server satu baris account_games. */
export async function updatePrivateServerLink({ accountId, accountGameId, link, required = false }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    if (!accountGameId) return { error: "Baris tautannya gak ketemu." };

    const trimmed = (link ?? "").trim();
    if (required && !trimmed) return { error: "Game ini wajib punya link private server." };

    const { error } = await supabase
        .from("account_games")
        .update({ private_server_link: trimmed || null })
        .eq("id", accountGameId);

    if (error) return { error: isDuplicate(error) ? "Link itu udah dipakai di tempat lain. Tiap link harus unik." : error.message };

    revalidateAccount(accountId);
    return { success: true };
}

/* ─────────────────────────── Item ↔ Akun ─────────────────────────── */

/** Tambahin satu item ke akun. Bikin item baru kalau namanya belum ada. */
export async function addItemToAccount({ accountId, gameId, itemId = null, itemName = "" }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    if (!accountId || !gameId) return { error: "Pilih game-nya dulu." };
    if (!itemId && !itemName.trim()) return { error: "Pilih atau tulis nama item-nya." };

    const { data: accountGame } = await supabase.from("account_games").select("id").eq("account_id", accountId).eq("game_id", gameId).maybeSingle();

    if (!accountGame) {
        const { data: game } = await supabase.from("games").select("name, requires_private_server").eq("id", gameId).maybeSingle();

        // Game yang wajib pakai link gak boleh ketaut otomatis dari sini —
        // hasilnya baris tanpa link, dan itu bikin template chat kirim link kosong.
        if (game?.requires_private_server) {
            return { error: `"${game.name}" wajib punya link private server. Tautin dulu dari tab Game.` };
        }

        await supabase.from("account_games").insert([{ account_id: accountId, game_id: gameId }]);
    }

    let finalItemId = itemId;

    if (!finalItemId) {
        const name = itemName.trim();
        const { data: found } = await supabase.from("items").select("id").eq("game_id", gameId).ilike("item_name", name).maybeSingle();

        if (found) {
            finalItemId = found.id;
        } else {
            const { data: created, error } = await supabase
                .from("items")
                .insert([{ game_id: gameId, item_name: name }])
                .select("id")
                .single();

            if (error) return { error: error.message };
            finalItemId = created.id;
        }
    }

    const { data: alreadyLinked } = await supabase.from("account_items").select("id").eq("account_id", accountId).eq("item_id", finalItemId).maybeSingle();

    if (alreadyLinked) return { error: "Item itu udah ketaut ke akun ini." };

    const { error } = await supabase.from("account_items").insert([{ item_id: finalItemId, account_id: accountId, is_available: true }]);
    if (error) return { error: error.message };

    revalidateAccount(accountId);
    return { success: true };
}

/**
 * Hapus satu item dari akun.
 *
 * Kalau itu item TERAKHIR dari game tersebut di akun ini, tautan game-nya juga
 * dilepas. Perilaku ini dipertahanin dari versi lama — tapi sekarang dibalikin
 * lewat flag `gameUnlinked` supaya UI bisa ngasih tau, bukan diem-diem.
 */
export async function removeAccountItem({ accountId, accountItemId, gameId }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    if (!accountItemId) return { error: "Item-nya gak ketemu." };

    const { error } = await supabase.from("account_items").delete().eq("id", accountItemId);
    if (error) return { error: error.message };

    let gameUnlinked = false;

    if (gameId) {
        const { data: remaining } = await supabase.from("account_items").select("id, items!inner(game_id)").eq("account_id", accountId).eq("items.game_id", gameId);

        if (!remaining || remaining.length === 0) {
            await supabase.from("account_games").delete().eq("account_id", accountId).eq("game_id", gameId);
            gameUnlinked = true;
        }
    }

    revalidateAccount(accountId);
    return { success: true, gameUnlinked };
}

/** Catatan stok per item-akun. */
export async function updateItemNotes({ accountId, accountItemId, notes }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    if (!accountItemId) return { error: "Item-nya gak ketemu." };

    const { error } = await supabase
        .from("account_items")
        .update({ stock_notes: notes?.trim() || null })
        .eq("id", accountItemId);

    if (error) return { error: error.message };

    revalidateAccount(accountId);
    return { success: true };
}

/**
 * Toggle ketersediaan item.
 * Nilai barunya dihitung dari DB, bukan dari yang dikirim klien — biar dua
 * admin yang ngeklik berdekatan gak saling nimpa dengan nilai basi.
 */
export async function toggleItemAvailability({ accountId, accountItemId }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    if (!accountItemId) return { error: "Item-nya gak ketemu." };

    const { data: current } = await supabase.from("account_items").select("is_available").eq("id", accountItemId).maybeSingle();
    if (!current) return { error: "Item-nya udah gak ada." };

    const next = !current.is_available;

    const { error } = await supabase.from("account_items").update({ is_available: next }).eq("id", accountItemId);
    if (error) return { error: error.message };

    revalidateAccount(accountId);
    return { success: true, isAvailable: next };
}

/* ─────────────────────────── Game baru dari combobox ─────────────────────────── */

/** Bikin baris game lokal dari kolom cari di combobox. */
export async function createGame(name) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    const trimmed = (name ?? "").trim();
    if (!trimmed) return { error: "Nama game-nya kosong." };

    const { data, error } = await supabase
        .from("games")
        .insert([{ name: trimmed }])
        .select("id, name, requires_private_server, items(id, item_name)")
        .single();

    if (error) return { error: isDuplicate(error) ? `Game "${trimmed}" udah ada.` : error.message };

    revalidatePath("/games");
    return { success: true, game: data };
}
