"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { gameSchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Mutasi di halaman detail game.
 *
 * Sebelumnya 14 operasi tulis jalan langsung dari browser client, cuma dijaga
 * RLS. Sekarang semuanya lewat Server Action yang dicek auth-nya.
 *
 * TEMUAN PALING PENTING DI FILE INI: aturan "wajib isi link dulu" (lihat
 * updateGame) itu cuma ada di klien. Artinya `requires_private_server` bisa
 * dinyalain lewat request langsung padahal masih ada akun tanpa link — persis
 * keadaan yang aturannya diciptain buat nyegah. Sekarang aturannya di server.
 */

const DUPLICATE_CODE = "23505";

function isDuplicate(error) {
    return error?.code === DUPLICATE_CODE || error?.message?.includes("duplicate");
}

/** Pesan yang manusiawi buat bentrokan link private server. */
function describeDuplicate(error) {
    if (error?.message?.includes("private_server_link")) {
        return "Link private server itu udah dipakai di tempat lain. Tiap link harus unik.";
    }
    return "Datanya udah ada. Cek lagi, mungkin udah pernah ditautin.";
}

async function guard() {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };
    return { supabase: await createSupabaseServerClient() };
}

function revalidateGame(gameId) {
    revalidatePath(`/games/${gameId}`);
    revalidatePath("/games");
    // Halaman akun nampilin tautan game juga.
    revalidatePath("/accounts");
}

/** Nolak akun yang kepilih dua kali di baris berbeda. */
function findDuplicateAccount(rows) {
    const seen = new Set();
    for (const row of rows) {
        if (seen.has(row.accountId)) return true;
        seen.add(row.accountId);
    }
    return false;
}

/* ─────────────────────────────── Game ─────────────────────────────── */

/**
 * Update data game.
 *
 * ATURAN YANG DIPINDAH KE SERVER: kalau `requiresPrivateServer` dinyalain,
 * semua akun yang udah ketaut ke game ini WAJIB punya link. Kalau masih ada
 * yang kosong, action ini gak nyimpen apa pun dan balikin `needsLinks` —
 * daftar akun yang harus diisi.
 *
 * `needsLinks` itu BUKAN error, tapi keadaan: UI-nya buka dialog isi link,
 * terus manggil action ini lagi sambil bawa `missingLinks` yang udah keisi.
 * Jadi validasinya gak bisa dilewati dengan cara nembak action-nya langsung.
 */
export async function updateGame({ gameId, name, imageUrl = "", requiresPrivateServer = false, missingLinks = null }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!gameId) return { error: "ID game gak ada." };

    const parsed = gameSchema.safeParse({ name, image_url: imageUrl, requires_private_server: requiresPrivateServer });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data game gak valid." };

    if (requiresPrivateServer) {
        // Kalau UI udah ngirim link yang keisi, simpen dulu sebelum lanjut.
        if (Array.isArray(missingLinks) && missingLinks.length > 0) {
            const blank = missingLinks.find((row) => !row.privateServerLink?.trim());
            if (blank) return { error: "Masih ada link yang kosong. Semuanya wajib diisi." };

            const { error } = await supabase.from("account_games").upsert(
                missingLinks.map((row) => ({
                    id: row.accountGameId,
                    account_id: row.accountId,
                    game_id: gameId,
                    private_server_link: row.privateServerLink.trim(),
                }))
            );

            if (error) return { error: isDuplicate(error) ? describeDuplicate(error) : error.message };
        }

        // Cek ULANG dari DB — bukan percaya apa yang dikirim klien.
        const { data: stillMissing } = await supabase.from("account_games").select("id, account_id, private_server_link, accounts(username)").eq("game_id", gameId).or('private_server_link.is.null,private_server_link.eq.""');

        if (stillMissing?.length > 0) {
            return {
                needsLinks: stillMissing.map((row) => ({
                    accountGameId: row.id,
                    accountId: row.account_id,
                    username: row.accounts?.username ?? "(akun kehapus)",
                    privateServerLink: row.private_server_link ?? "",
                })),
            };
        }
    }

    const { error } = await supabase
        .from("games")
        .update({
            name: parsed.data.name,
            image_url: parsed.data.image_url || null,
            requires_private_server: parsed.data.requires_private_server,
        })
        .eq("id", gameId);

    if (error) return { error: error.message };

    revalidateGame(gameId);
    return { success: true };
}

export async function deleteGame(gameId) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!gameId) return { error: "ID game gak ada." };

    const { error } = await supabase.from("games").delete().eq("id", gameId);
    if (error) return { error: error.message };

    revalidateGame(gameId);
    return { success: true };
}

/* ──────────────────────────── Akun ↔ Game ──────────────────────────── */

/** Tautin satu akun ke game ini, sekaligus (opsional) beberapa item. */
export async function linkAccountToGame({ gameId, accountId, privateServerLink = "", items = [] }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!gameId || !accountId) return { error: "Game atau akunnya belum dipilih." };

    const { data: game } = await supabase.from("games").select("name, requires_private_server").eq("id", gameId).maybeSingle();
    if (!game) return { error: "Game-nya udah gak ada." };

    const link = privateServerLink.trim();
    if (game.requires_private_server && !link) {
        return { error: `"${game.name}" wajib punya link private server.` };
    }

    const { error } = await supabase.from("account_games").insert([{ game_id: gameId, account_id: accountId, private_server_link: link || null }]);

    if (error) {
        if (isDuplicate(error)) {
            return { error: error.message?.includes("private_server_link") ? describeDuplicate(error) : "Akun itu udah ketaut ke game ini." };
        }
        return { error: error.message };
    }

    const added = await attachItems(supabase, { gameId, accountId, items });

    revalidateGame(gameId);
    return { success: true, itemsAdded: added };
}

/** Lepas satu akun dari game ini, plus semua item game ini di akun itu. */
export async function unlinkAccountFromGame({ gameId, accountGameId, accountId }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!accountGameId) return { error: "Baris tautannya gak ketemu." };

    const { error } = await supabase.from("account_games").delete().eq("id", accountGameId);
    if (error) return { error: error.message };

    // Item game ini yang nempel di akun itu ikut dilepas — kalau nggak, dia
    // jadi item yatim: kelihatan di akun tapi game-nya udah gak ketaut.
    if (accountId) {
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
    }

    revalidateGame(gameId);
    return { success: true };
}

/** Ubah link private server satu baris account_games. */
export async function updateAccountGameLink({ gameId, accountGameId, link, required = false }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!accountGameId) return { error: "Baris tautannya gak ketemu." };

    const trimmed = (link ?? "").trim();
    if (required && !trimmed) return { error: "Game ini wajib punya link private server." };

    const { error } = await supabase
        .from("account_games")
        .update({ private_server_link: trimmed || null })
        .eq("id", accountGameId);

    if (error) return { error: isDuplicate(error) ? describeDuplicate(error) : error.message };

    revalidateGame(gameId);
    return { success: true };
}

/* ───────────────────────────────  Item  ─────────────────────────────── */

/** Helper: bikin/cari item lalu tempelin ke satu akun. Balikin jumlah yang masuk. */
async function attachItems(supabase, { gameId, accountId, items }) {
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

        const { data: linked } = await supabase.from("account_items").select("id").eq("account_id", accountId).eq("item_id", itemId).maybeSingle();
        if (linked) continue;

        const { error } = await supabase.from("account_items").insert([{ item_id: itemId, account_id: accountId, is_available: true }]);
        if (!error) added += 1;
    }

    return added;
}

/**
 * Bikin atau edit item game.
 *
 * Mode EDIT cuma ngubah nama & deskripsi (sama kayak sebelumnya).
 * Mode BIKIN wajib nyebut minimal satu akun — item tanpa akun itu stok hantu:
 * kelihatan ada tapi gak nempel di mana pun.
 */
export async function saveGameItem({ gameId, itemId = null, itemName, description = "", accounts = [] }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!gameId) return { error: "ID game gak ada." };

    const name = (itemName ?? "").trim();
    if (!name) return { error: "Nama item gak boleh kosong." };

    // ── Edit ──
    if (itemId) {
        const { error } = await supabase
            .from("items")
            .update({ item_name: name, description: description?.trim() || null })
            .eq("id", itemId);

        if (error) return { error: isDuplicate(error) ? `Item "${name}" udah ada di game ini.` : error.message };

        revalidateGame(gameId);
        return { success: true };
    }

    // ── Bikin baru ──
    const rows = accounts.filter((row) => row.accountId);
    if (rows.length === 0) return { error: "Pilih minimal satu akun yang nyimpen item ini." };
    if (findDuplicateAccount(rows)) return { error: "Ada akun yang kepilih dua kali." };

    const { data: game } = await supabase.from("games").select("requires_private_server").eq("id", gameId).maybeSingle();
    if (!game) return { error: "Game-nya udah gak ada." };

    if (game.requires_private_server) {
        const blank = rows.find((row) => !row.privateServerLink?.trim());
        if (blank) return { error: "Game ini wajib private server, jadi semua akun yang dipilih wajib punya link." };
    }

    // Pastiin tiap akun ketaut ke game ini dulu.
    for (const row of rows) {
        const link = row.privateServerLink?.trim() ?? "";

        const { data: existing } = await supabase.from("account_games").select("id").eq("account_id", row.accountId).eq("game_id", gameId).maybeSingle();

        if (existing) {
            if (!link) continue;
            const { error } = await supabase.from("account_games").update({ private_server_link: link }).eq("id", existing.id);
            if (error) return { error: isDuplicate(error) ? describeDuplicate(error) : error.message };
        } else {
            const { error } = await supabase.from("account_games").insert([{ account_id: row.accountId, game_id: gameId, private_server_link: link || null }]);
            if (error) return { error: isDuplicate(error) ? describeDuplicate(error) : error.message };
        }
    }

    const { data: created, error: itemError } = await supabase
        .from("items")
        .insert([{ game_id: gameId, item_name: name, description: description?.trim() || null }])
        .select("id")
        .single();

    if (itemError) return { error: isDuplicate(itemError) ? `Item "${name}" udah ada di game ini.` : itemError.message };

    const { error: stockError } = await supabase.from("account_items").insert(rows.map((row) => ({ item_id: created.id, account_id: row.accountId, is_available: true })));

    revalidateGame(gameId);

    // Item-nya udah kebikin walau stoknya gagal — dibedain biar user tau
    // persis apa yang perlu dibenerin manual.
    if (stockError) {
        return { success: true, partial: true, error: `Item kebikin, tapi stok akunnya gagal: ${stockError.message}` };
    }

    return { success: true, accountsAttached: rows.length };
}

export async function deleteGameItem({ gameId, itemId }) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };
    if (!itemId) return { error: "ID item gak ada." };

    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) return { error: error.message };

    revalidateGame(gameId);
    return { success: true };
}

/* ─────────────────────── Akun baru dari combobox ─────────────────────── */

export async function createAccountForGame(username) {
    const { supabase, error: guardError } = await guard();
    if (guardError) return { error: guardError };

    const trimmed = (username ?? "").trim();
    if (!trimmed) return { error: "Username-nya kosong." };

    const { data, error } = await supabase
        .from("accounts")
        .insert([{ username: trimmed }])
        .select("id, username, status")
        .single();

    if (error) return { error: isDuplicate(error) ? `Akun "${trimmed}" udah kedaftar.` : error.message };

    revalidatePath("/accounts");
    return { success: true, account: data };
}
