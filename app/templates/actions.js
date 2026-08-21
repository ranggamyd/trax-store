"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { templateSchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Mutasi chat template.
 *
 * Yang paling penting di sini: `templateSchema` dijalanin DI SERVER.
 * Sebelumnya `safeParse` cuma dipanggil di handler klien — dan skema ini bukan
 * validasi remeh, dia punya `superRefine` (Specific wajib punya game_id) plus
 * `transform` yang MENGOSONGKAN game_id/account_id kalau tipenya General.
 *
 * Artinya di versi lama, request yang dikirim langsung ke Server Action bisa
 * nyimpen template "General" yang masih nyangkut game_id — dan itu bikin
 * template nongol di tempat yang salah waktu balesin order.
 */
async function guardAndParse(payload) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };

    const parsed = templateSchema.safeParse(payload);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Data template belum bener." };
    }

    return { data: parsed.data };
}

export async function createTemplate(payload) {
    const guard = await guardAndParse(payload);
    if (guard.error) return { error: guard.error };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("chat_templates").insert(guard.data);

    if (error) return { error: error.message };

    revalidatePath("/templates");
    return { success: true };
}

export async function updateTemplate(id, payload) {
    if (!id) return { error: "ID template gak ada." };

    const guard = await guardAndParse(payload);
    if (guard.error) return { error: guard.error };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("chat_templates").update(guard.data).eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/templates");
    return { success: true };
}

/**
 * Duplikat template.
 *
 * Sumbernya dibaca ULANG dari DB, bukan nerima objek dari klien. Versi lama
 * nge-spread baris yang ada di state browser — jadi kalau ada admin lain yang
 * baru ngubah template itu, yang kesalin adalah versi basi di layar.
 */
export async function duplicateTemplate(id) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };
    if (!id) return { error: "ID template gak ada." };

    const supabase = await createSupabaseServerClient();

    const { data: source, error: readError } = await supabase.from("chat_templates").select("*").eq("id", id).maybeSingle();

    if (readError) return { error: readError.message };
    if (!source) return { error: "Template-nya udah gak ada." };

    const { id: _id, created_at: _createdAt, ...copy } = source;
    const title = `${source.title} (copy)`;

    const { error } = await supabase.from("chat_templates").insert({ ...copy, title });
    if (error) return { error: error.message };

    revalidatePath("/templates");
    return { success: true, title };
}

export async function deleteTemplate(id) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };
    if (!id) return { error: "ID template gak ada." };

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("chat_templates").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/templates");
    return { success: true };
}
