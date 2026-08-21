import "server-only";

import { getCurrentAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const USERS_PAGE_SIZE = 20;

/**
 * Baca daftar admin. Bukan endpoint — dipanggil langsung dari Server Component.
 *
 * KENAPA FILTER & PAGINATION-NYA DI MEMORI, BUKAN DI DATABASE:
 *
 * Sumber datanya `supabaseAdmin.auth.admin.listUsers()`, dan API Auth Supabase
 * gak punya parameter pencarian. Datanya juga bukan tabel biasa — dia digabung
 * sama `admin_profiles` buat dapetin username, dan akun lama bisa gak punya
 * baris profil sama sekali.
 *
 * Jadi ini keputusan sadar, bukan kelalaian: daftar admin itu isinya puluhan
 * (satu tim), bukan puluhan ribu. Beda banget sama tabel `accounts` yang
 * pencariannya WAJIB di Postgres karena bisa tumbuh tanpa batas.
 *
 * Yang penting: kerjanya sekarang di SERVER, bukan di browser. Klien gak lagi
 * nerima seluruh daftar admin beserta semua emailnya cuma buat difilter.
 */
export async function listAdmins({ query = "", page = 1, pageSize = USERS_PAGE_SIZE } = {}) {
    if (!(await getCurrentAdmin())) {
        return { users: [], total: 0, pageCount: 1, pageSize, error: "Sesi lu udah abis." };
    }

    const [{ data: authData, error: authError }, { data: profileData }] = await Promise.all([supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }), supabaseAdmin.from("admin_profiles").select("id, username, primary_email, emails")]);

    if (authError) {
        return { users: [], total: 0, pageCount: 1, pageSize, error: authError.message };
    }

    const profiles = profileData ?? [];

    const merged = (authData?.users ?? [])
        .map((u) => {
            const profile = profiles.find((p) => p.id === u.id);
            return {
                id: u.id,
                username: profile?.username ?? "Belum diatur (akun lama)",
                primary_email: profile?.primary_email ?? u.email,
                emails: profile?.emails ?? [u.email],
                created_at: u.created_at,
                has_profile: Boolean(profile),
            };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const needle = query.trim().toLowerCase();
    const filtered = needle ? merged.filter((u) => u.username?.toLowerCase().includes(needle) || u.primary_email?.toLowerCase().includes(needle) || (u.emails ?? []).some((e) => e?.toLowerCase().includes(needle))) : merged;

    const total = filtered.length;
    const from = (page - 1) * pageSize;

    return {
        users: filtered.slice(from, from + pageSize),
        total,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        pageSize,
        error: null,
    };
}

/** Satu admin, buat pre-fill dialog edit dari ?edit=<id>. */
export async function getAdminById(id) {
    if (!id) return null;
    if (!(await getCurrentAdmin())) return null;

    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("id, username, primary_email, emails").eq("id", id).maybeSingle();

    if (profile) return profile;

    // Akun lama tanpa baris profil masih harus bisa diedit — justru itu cara
    // ngasih dia profil. Balikin bentuk yang sama biar form-nya gak perlu
    // mikirin dua kemungkinan.
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!authUser?.user) return null;

    return {
        id: authUser.user.id,
        username: "",
        primary_email: authUser.user.email,
        emails: [authUser.user.email].filter(Boolean),
    };
}
