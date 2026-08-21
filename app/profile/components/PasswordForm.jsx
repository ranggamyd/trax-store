"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const MIN_PASSWORD_LENGTH = 6;

/**
 * Ganti password sendiri.
 *
 * Sengaja TETAP di klien pakai `supabase.auth.updateUser`. Ini satu-satunya
 * jalur yang bener buat "user ganti password sendiri": dia jalan atas nama
 * session yang aktif. Lewat Server Action + service-role justru lebih buruk —
 * itu jadi jalur "admin nyetel password orang", yang seharusnya cuma ada di
 * /users, bukan di halaman profil.
 *
 * Toast-nya juga dibalikin di sini — di versi lama semuanya di-comment out,
 * jadi ganti password gak ngasih tanda berhasil ATAU gagal.
 */
export function PasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < MIN_PASSWORD_LENGTH) {
            toast.error("Password kependekan", { description: `Minimal ${MIN_PASSWORD_LENGTH} karakter.` });
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Konfirmasi gak cocok", { description: "Dua kolom password harus isinya sama." });
            return;
        }

        setIsSaving(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsSaving(false);

        if (error) {
            toast.error("Gagal ganti password", { description: error.message });
            return;
        }

        setPassword("");
        setConfirmPassword("");
        toast.success("Password keganti", { description: "Dipakai mulai login berikutnya." });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput label="Password baru" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="h-9" />

            <PasswordInput label="Ulangi password baru" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="h-9" />

            <Button type="submit" disabled={isSaving} className="font-semibold">
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Nyimpen...
                    </>
                ) : (
                    <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Ganti password
                    </>
                )}
            </Button>
        </form>
    );
}
