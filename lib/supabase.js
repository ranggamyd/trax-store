import { createBrowserClient } from "@supabase/ssr";

// Referensi env HARUS statis (bukan process.env[name]) supaya Next bisa nginline
// nilainya ke bundle client. Akses dinamis bakal ke-resolve jadi undefined.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Gagal keras di sini jauh lebih murah daripada fallback "placeholder.supabase.co"
    // yang nyembunyiin misconfig jadi error jaringan misterius di runtime.
    throw new Error("[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset. Cek .env.local.");
}

/**
 * Client browser dengan session di COOKIE (bukan localStorage).
 * Ini yang bikin server (middleware, Server Action, RSC) bisa tau siapa yang login.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
