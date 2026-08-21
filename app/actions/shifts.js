"use server";

import { revalidatePath } from "next/cache";

import { getUsernameMap } from "@/app/shifts/queries";
import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * MUTASI shift saja.
 *
 * Semua fungsi BACA pindah ke app/shifts/queries.js (server-only). Yang tinggal
 * di sini cuma tiga aksi yang beneran ngubah data — dan cuma itu yang memang
 * perlu jadi endpoint, karena dipanggil dari tombol di browser.
 *
 * Dua halaman yang nampilin shift (/ dan /shifts) di-revalidate di tiap mutasi.
 * Ini yang gantiin prop-drilling `refreshTick` di versi lama: dulu tiap tombol
 * harus manggil `onShiftChange()` supaya tiga komponen anak nge-fetch ulang —
 * dan tiap komponen baru harus diinget buat disambungin. Sekarang server yang
 * nandain cache-nya basi, jadi gak ada yang bisa kelupaan.
 */

function revalidateShiftViews() {
    revalidatePath("/");
    revalidatePath("/shifts");
}

/** Mulai shift buat admin yang login. */
export async function startShift(notes = "") {
    const admin = await getCurrentAdmin();
    if (!admin) return { error: UNAUTHORIZED_MESSAGE };

    // Cek bentrok dibaca dari DB, bukan dari layar. Dua admin yang klik hampir
    // bersamaan gak bisa dua-duanya kebikin shift.
    const { data: activeShift } = await supabaseAdmin.from("shifts").select("id, user_id").is("ended_at", null).maybeSingle();

    if (activeShift) {
        const userMap = await getUsernameMap();
        const holder = userMap[activeShift.user_id] ?? "Orang lain";
        return { error: `${holder} masih jaga. Akhirin dulu, atau takeover.` };
    }

    // user_id-nya dari session, BUKAN parameter. Versi lama nerima userId dari
    // klien — jadi siapa pun bisa mulai shift atas nama admin lain.
    const { data: shift, error } = await supabaseAdmin
        .from("shifts")
        .insert({ user_id: admin.id, started_at: new Date().toISOString(), notes: notes || null })
        .select("*")
        .single();

    if (error) return { error: error.message };

    revalidateShiftViews();
    return { shift };
}

/** Akhirin shift yang sedang jalan. */
export async function endShift(shiftId) {
    const admin = await getCurrentAdmin();
    if (!admin) return { error: UNAUTHORIZED_MESSAGE };
    if (!shiftId) return { error: "ID shift gak ada." };

    // Cuma yang megang shift yang boleh ngelepas. Kalau mau ganti orang,
    // itu namanya takeover — dan itu aksi terpisah yang kecatat beda.
    const { data: shift } = await supabaseAdmin.from("shifts").select("id, user_id, ended_at").eq("id", shiftId).maybeSingle();

    if (!shift) return { error: "Shift-nya udah gak ada." };
    if (shift.ended_at) return { error: "Shift ini udah diakhirin." };
    if (shift.user_id !== admin.id) return { error: "Ini shift orang lain. Pakai takeover." };

    const { error } = await supabaseAdmin.from("shifts").update({ ended_at: new Date().toISOString(), ended_by: "self" }).eq("id", shiftId);

    if (error) return { error: error.message };

    revalidateShiftViews();
    return { success: true };
}

/** Ambil alih: akhirin shift yang jalan, mulai shift baru buat yang login. */
export async function takeoverShift(currentShiftId) {
    const admin = await getCurrentAdmin();
    if (!admin) return { error: UNAUTHORIZED_MESSAGE };
    if (!currentShiftId) return { error: "ID shift gak ada." };

    const { data: current } = await supabaseAdmin.from("shifts").select("id, user_id, ended_at").eq("id", currentShiftId).maybeSingle();

    if (!current) return { error: "Shift-nya udah gak ada." };
    if (current.ended_at) return { error: "Shift itu udah keburu diakhirin. Refresh dulu." };
    if (current.user_id === admin.id) return { error: "Itu shift lu sendiri." };

    const { error: endError } = await supabaseAdmin.from("shifts").update({ ended_at: new Date().toISOString(), ended_by: "takeover" }).eq("id", currentShiftId);

    if (endError) return { error: endError.message };

    const { data: newShift, error: startError } = await supabaseAdmin.from("shifts").insert({ user_id: admin.id, started_at: new Date().toISOString(), takeover_from: currentShiftId }).select("*").single();

    if (startError) return { error: startError.message };

    revalidateShiftViews();
    return { shift: newShift };
}
