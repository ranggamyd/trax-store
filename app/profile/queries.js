import "server-only";

import { getCurrentAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Baca profil ADMIN YANG LOGIN.
 *
 * ID-nya diambil dari session di server, bukan dari parameter. Ini bedanya sama
 * versi lama yang nge-query `.eq("id", s.user.id)` di browser: di sini gak ada
 * ID yang lewat klien sama sekali, jadi gak ada yang bisa ditukar.
 */
export async function getMyProfile() {
    const admin = await getCurrentAdmin();
    if (!admin) return null;

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("admin_profiles").select("id, username, primary_email, emails").eq("id", admin.id).maybeSingle();

    // Akun lama bisa belum punya baris profil. Balikin bentuk yang sama biar
    // form-nya gak perlu mikirin dua kemungkinan — ngisi form ini justru
    // cara bikin profilnya.
    return {
        id: admin.id,
        username: data?.username ?? "",
        primary_email: data?.primary_email ?? admin.email,
        emails: data?.emails?.length ? data.emails : [admin.email].filter(Boolean),
        has_profile: Boolean(data),
    };
}
