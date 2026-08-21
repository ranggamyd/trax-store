"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { accountSchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Mutasi akun.
 *
 * Semuanya lewat `createSupabaseServerClient` (RLS jalan), BUKAN supabaseAdmin.
 * Bedanya penting: kalau nanti lu bikin peran non-admin, kebijakan RLS-nya
 * langsung berlaku di sini tanpa ada kode yang perlu diubah.
 *
 * Tiap action divalidasi ULANG pakai Zod di server. Validasi di klien itu buat
 * UX; dia gak ngunci apa-apa. Server Action bisa ditembak langsung, jadi skema
 * yang sama harus dijalanin lagi di sisi ini.
 *
 * `revalidatePath` gantiin pola `fetchAccounts()` manual di klien: server yang
 * nandain cache-nya basi, dan Next yang ngirim data baru. Gak ada lagi
 * "abis simpen, panggil fetch lagi" — dan gak ada lagi kemungkinan lupa manggil.
 */

const STATUS = { HAS_ROBUX: "ACTIVE", NO_ROBUX: "EMPTY_ROBUX" };

function statusFromHasRobux(hasRobux) {
    return hasRobux ? STATUS.HAS_ROBUX : STATUS.NO_ROBUX;
}

/** Validasi payload + cek auth sekali di satu tempat. */
async function guardAndParse(payload) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };

    const parsed = accountSchema.safeParse(payload);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Data yang dikirim gak valid." };
    }

    return { data: parsed.data };
}

/**
 * Cek username kepakai atau belum.
 *
 * Yang lama pakai `.single()` — dan `.single()` nge-ERROR kalau barisnya nol,
 * jadi jalur "username masih kosong" itu sebenernya jalur error yang diabaikan
 * diam-diam. `.maybeSingle()` yang bener buat "mungkin ada, mungkin nggak".
 */
async function isUsernameTaken(supabase, username, exceptId) {
    let request = supabase.from("accounts").select("id").eq("username", username);
    if (exceptId) request = request.neq("id", exceptId);

    const { data } = await request.maybeSingle();
    return Boolean(data);
}

export async function createAccount(payload) {
    const guard = await guardAndParse(payload);
    if (guard.error) return { error: guard.error };

    const { username, notes, has_robux } = guard.data;
    const supabase = await createSupabaseServerClient();

    if (await isUsernameTaken(supabase, username)) {
        return { error: `Akun "${username}" udah kedaftar.` };
    }

    const { error } = await supabase.from("accounts").insert([{ username, notes: notes || null, status: statusFromHasRobux(has_robux) }]);

    if (error) return { error: error.message };

    revalidatePath("/accounts");
    return { success: true };
}

export async function updateAccount(id, payload) {
    if (!id) return { error: "ID akun gak ada." };

    const guard = await guardAndParse(payload);
    if (guard.error) return { error: guard.error };

    const { username, notes, has_robux } = guard.data;
    const supabase = await createSupabaseServerClient();

    if (await isUsernameTaken(supabase, username, id)) {
        return { error: `Username "${username}" udah dipakai akun lain.` };
    }

    const { error } = await supabase
        .from("accounts")
        .update({ username, notes: notes || null, status: statusFromHasRobux(has_robux) })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/accounts");
    revalidatePath(`/accounts/${id}`);
    return { success: true };
}

export async function deleteAccount(id) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };
    if (!id) return { error: "ID akun gak ada." };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("accounts").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/accounts");
    return { success: true };
}

/**
 * Toggle stok robux.
 *
 * Status barunya dihitung dari yang KEBACA DI DB, bukan dari yang dikirim
 * klien. Kalau dua admin ngeklik hampir bersamaan, versi lama bisa nulis balik
 * nilai basi yang kebetulan masih nyangkut di layar salah satunya.
 */
export async function toggleAccountRobux(id) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };
    if (!id) return { error: "ID akun gak ada." };

    const supabase = await createSupabaseServerClient();

    const { data: current, error: readError } = await supabase.from("accounts").select("status").eq("id", id).maybeSingle();

    if (readError) return { error: readError.message };
    if (!current) return { error: "Akunnya udah gak ada." };

    const nextStatus = current.status === STATUS.NO_ROBUX ? STATUS.HAS_ROBUX : STATUS.NO_ROBUX;

    const { error } = await supabase.from("accounts").update({ status: nextStatus }).eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/accounts");
    revalidatePath(`/accounts/${id}`);
    return { success: true, status: nextStatus };
}
