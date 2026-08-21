import "server-only";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const ACCOUNTS_PAGE_SIZE = 20;

/**
 * KENAPA FILE INI BUKAN "use server":
 *
 * File "use server" ngubah tiap export jadi ENDPOINT HTTP yang bisa ditembak
 * siapa pun yang tau Action ID-nya. Buat mutasi itu memang yang dibutuhin.
 * Buat query baca yang cuma dipanggil Server Component, itu permukaan serangan
 * gratisan — jadi query-nya ditaro di sini, dipagerin `server-only`, dan
 * dipanggil LANGSUNG (bukan lewat jaringan) dari page.js.
 *
 * Client-nya `createSupabaseServerClient` (bukan supabaseAdmin), jadi RLS tetep
 * jalan pakai identitas user yang login.
 */

/**
 * Bikin filter pencarian yang aman buat PostgREST `.or()`.
 *
 * `.or()` nerima STRING filter mentah, jadi input user yang diinterpolasi
 * langsung ke situ itu filter injection — persis bug yang ada di
 * resolveLoginIdentifier sebelumnya.
 *
 * Dua lapis pertahanan:
 *   1. Nilainya dibungkus tanda kutip ganda. Di dalam kutip, koma dan kurung
 *      gak dibaca sebagai pemisah filter lagi.
 *   2. Backslash dan kutip ganda dibuang dari input, jadi pembungkusnya
 *      mustahil dipecah dari dalam.
 *
 * Wildcard ILIKE (% _ *) juga dibuang, supaya "%" yang diketik user dibaca
 * sebagai teks biasa dan bukan "cocokin semua".
 */
function buildSearchFilter(raw) {
    const safe = raw.replace(/[\\"%_*]/g, "").trim();
    if (!safe) return null;
    return `username.ilike."%${safe}%",notes.ilike."%${safe}%"`;
}

/**
 * Ambil akun dengan pencarian + pagination DI DATABASE.
 *
 * Yang lama: `.select("*")` tanpa limit, terus `.filter()` di render browser.
 * Aman di 100 baris, mati di 10.000 — dan tiap keystroke nge-filter ulang
 * seluruh array di main thread.
 */
export async function getAccounts({ query = "", page = 1, pageSize = ACCOUNTS_PAGE_SIZE } = {}) {
    const supabase = await createSupabaseServerClient();

    let request = supabase.from("accounts").select("id, username, notes, status, created_at", { count: "exact" }).order("created_at", { ascending: false });

    const filter = buildSearchFilter(query);
    if (filter) request = request.or(filter);

    const from = (page - 1) * pageSize;
    request = request.range(from, from + pageSize - 1);

    const { data, error, count } = await request;

    if (error) {
        return { accounts: [], total: 0, pageCount: 1, pageSize, error: error.message };
    }

    const total = count ?? 0;

    return {
        accounts: data ?? [],
        total,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        pageSize,
        error: null,
    };
}

/** Ambil satu akun. Dipakai buat pre-fill dialog edit dari ?edit=<id>. */
export async function getAccountById(id) {
    if (!id) return null;

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("accounts").select("id, username, notes, status").eq("id", id).maybeSingle();

    return data ?? null;
}
