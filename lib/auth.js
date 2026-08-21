import "server-only";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** Pesan seragam buat dibalikin ke UI waktu session-nya udah mati. */
export const UNAUTHORIZED_MESSAGE = "Sesi lu udah abis. Login ulang dulu ya.";

/** Kode error yang dilempar dari choke point. Ditangkep try/catch yang udah ada. */
export const UNAUTHORIZED_CODE = "UNAUTHORIZED";

/**
 * Balikin user yang login, atau null.
 *
 * Pakai getUser() (bukan getSession()) karena getUser() memverifikasi JWT ke
 * server Supabase. getSession() cuma percaya isi cookie apa adanya — dan cookie
 * itu dikirim klien, jadi gak boleh dipercaya buat keputusan otorisasi.
 */
export async function getCurrentAdmin() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
}

/**
 * Versi yang melempar. Dipakai di choke point (mis. fetchEldorado) supaya satu
 * baris ini ngunci puluhan action sekaligus, dan gagalnya fail-closed.
 */
export async function requireAdmin() {
    const user = await getCurrentAdmin();
    if (!user) throw new Error(UNAUTHORIZED_CODE);
    return user;
}
