import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("[supabaseServer] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset.");
}

/**
 * Client Supabase buat konteks server (RSC / Server Action / Route Handler).
 * Baca session dari cookie, jadi RLS jalan sesuai user yang login.
 * Ini yang dipakai buat CEK IDENTITAS. Buat operasi yang butuh bypass RLS,
 * pakai supabaseAdmin — tapi WAJIB di belakang requireAdmin().
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch {
                    // Server Component gak boleh nulis cookie. Aman diabaikan:
                    // middleware yang tanggung jawab nge-refresh session.
                }
            },
        },
    });
}
