"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin, UNAUTHORIZED_MESSAGE } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Batas wajar buat identifier login. Nolak payload aneh sebelum nyentuh DB. */
const MAX_IDENTIFIER_LENGTH = 254;

/**
 * SENGAJA TANPA AUTH — dipanggil dari halaman login, sebelum user punya session.
 *
 * Dulu di sini ada:
 *   .or(`username.eq.${identifier},emails.cs.{${identifier}}`)
 * `identifier` dateng mentah dari input user dan diinterpolasi ke string filter
 * PostgREST. Tanda koma / kurung kurawal di input bisa nyambung jadi filter
 * tambahan alias FILTER INJECTION. Dua query terpisah pakai .eq() dan .contains()
 * itu ter-parameterisasi dengan bener, jadi input gak bisa jadi sintaks query.
 *
 * Balikannya sengaja SELALU berbentuk sama (ketemu atau nggak) biar gak bisa
 * dipakai buat nebak username mana yang kedaftar.
 */
export async function resolveLoginIdentifier(identifier) {
    const raw = typeof identifier === "string" ? identifier.trim() : "";
    if (!raw || raw.length > MAX_IDENTIFIER_LENGTH) return { email: raw };

    const { data: byUsername } = await supabaseAdmin.from("admin_profiles").select("primary_email").eq("username", raw).maybeSingle();
    if (byUsername?.primary_email) return { email: byUsername.primary_email };

    const { data: byEmail } = await supabaseAdmin.from("admin_profiles").select("primary_email").contains("emails", [raw]).maybeSingle();
    if (byEmail?.primary_email) return { email: byEmail.primary_email };

    // Gak ketemu: balikin apa adanya dan biar Supabase Auth yang nolak.
    // Jangan bocorin "user gak ada" — itu ngasih attacker daftar username valid.
    return { email: raw };
}

export async function listUsers() {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) return { error: authError.message };

    const { data: profileData } = await supabaseAdmin.from("admin_profiles").select("*");
    const profiles = profileData || [];

    const mergedUsers = authData.users
        .map((u) => {
            const profile = profiles.find((p) => p.id === u.id);
            return {
                id: u.id,
                username: profile ? profile.username : "Belum diatur (Akun Lama)",
                primary_email: profile ? profile.primary_email : u.email,
                emails: profile ? profile.emails : [u.email],
                created_at: u.created_at,
            };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { users: mergedUsers };
}

export async function createUser(payload) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };

    const { username, password, emails } = payload;
    if (!username || !emails || emails.length === 0) return { error: "Username dan minimal 1 email wajib diisi!" };

    const primaryEmail = emails[0].trim();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: primaryEmail,
        password: password,
        email_confirm: true,
    });

    if (authError) {
        if (authError.message.toLowerCase().includes("already registered")) {
            return { error: "Email ini udah dipakai sama admin lain! Coba pakai email lain." };
        }
        return { error: authError.message };
    }

    const { error: profileError } = await supabaseAdmin.from("admin_profiles").insert([
        {
            id: authData.user.id,
            username: username.trim(),
            primary_email: primaryEmail,
            emails: emails.map((e) => e.trim()),
        },
    ]);

    if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        if (profileError.code === "23505" || profileError.message.includes("duplicate")) {
            return { error: "Username ini udah dipakai bos, cari nama lain dong!" };
        }
        return { error: profileError.message };
    }

    // Gantiin pola `fetchUsers()` manual di klien: server yang nandain cache-nya
    // basi, jadi gak ada lagi kemungkinan lupa manggil refresh setelah simpan.
    revalidatePath("/users");
    return { user: authData.user };
}

export async function deleteUser(id) {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) return { error: UNAUTHORIZED_MESSAGE };

    // Nolak bunuh diri: admin terakhir yang ngehapus dirinya sendiri bikin
    // dashboard-nya kekunci permanen tanpa jalan masuk.
    if (currentAdmin.id === id) return { error: "Gak bisa hapus akun lu sendiri, bro." };

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return { error: error.message };

    revalidatePath("/users");
    return { success: true };
}

export async function updateUser(id, payload) {
    if (!(await getCurrentAdmin())) return { error: UNAUTHORIZED_MESSAGE };

    const { username, password, emails } = payload;
    if (!username || !emails || emails.length === 0) return { error: "Username dan minimal 1 email wajib diisi!" };

    const primaryEmail = emails[0].trim();

    const updateData = { email: primaryEmail, email_confirm: true };
    if (password && password.trim() !== "") {
        updateData.password = password;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);

    if (authError) {
        if (authError.message.toLowerCase().includes("already registered")) {
            return { error: "Email ini udah dipakai sama admin lain! Coba pakai email lain." };
        }
        return { error: authError.message };
    }

    const { error: profileError } = await supabaseAdmin.from("admin_profiles").upsert({
        id: id,
        username: username.trim(),
        primary_email: primaryEmail,
        emails: emails.map((e) => e.trim()),
    });

    if (profileError) {
        if (profileError.code === "23505" || profileError.message.includes("duplicate")) {
            return { error: "Username ini udah dipakai bos, ganti yang lain ya!" };
        }
        return { error: profileError.message };
    }

    revalidatePath("/users");
    return { success: true };
}
