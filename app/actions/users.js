"use server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function resolveLoginIdentifier(identifier) {
    const { data } = await supabaseAdmin.from("admin_profiles").select("primary_email").or(`username.eq.${identifier},emails.cs.{${identifier}}`).maybeSingle();

    if (data && data.primary_email) {
        return { email: data.primary_email };
    }
    return { email: identifier };
}

export async function listUsers() {
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

    return { user: authData.user };
}

export async function deleteUser(id) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return { error: error.message };
    return { success: true };
}

export async function updateUser(id, payload) {
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

    return { success: true };
}
