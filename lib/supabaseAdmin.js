// "server-only" bikin build GAGAL kalau file ini kesenggol dari client component.
// Penting: modul ini megang SERVICE ROLE key yang bypass semua RLS — dia gak boleh
// pernah nyampe ke bundle browser, sekali pun karena impor yang gak sengaja.
import "server-only";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("[supabaseAdmin] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset.");
}

/**
 * Client dengan hak penuh (bypass RLS).
 *
 * ATURAN: setiap pemanggilan harus di belakang requireAdmin()/getCurrentAdmin()
 * dari @/lib/auth. Server Action itu endpoint HTTP publik — tanpa cek itu, tiap
 * query di sini setara ngasih akses DB penuh ke internet.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
