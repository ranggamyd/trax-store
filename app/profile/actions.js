"use server";

import { revalidatePath } from "next/cache";

import { updateUser } from "@/app/actions/users";
import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";

/**
 * Update profil sendiri.
 *
 * Bedanya sama manggil `updateUser(id, ...)` langsung dari klien: ID-nya
 * DITENTUIN SERVER dari session, bukan dikirim browser. Halaman profil gak
 * punya urusan sama ID orang lain, jadi jangan sampai bisa nyebut ID lain —
 * sekalipun action-nya udah dibatasin buat admin.
 *
 * Logika update-nya sendiri dipakai ulang dari app/actions/users.js supaya
 * aturan email & username cuma ada di satu tempat.
 */
export async function updateMyProfile({ username, emails }) {
    const admin = await getCurrentAdmin();
    if (!admin) return { error: UNAUTHORIZED_MESSAGE };

    const result = await updateUser(admin.id, { username, password: "", emails });
    if (result?.error) return { error: result.error };

    revalidatePath("/profile");
    revalidatePath("/users");
    return { success: true };
}
