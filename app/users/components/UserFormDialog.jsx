"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createUser, updateUser } from "@/app/actions/users";
import { EmailListInput } from "@/components/molecules/EmailListInput";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD_LENGTH = 6;

/**
 * Akun lama bisa punya email di Auth tapi belum punya baris profil, jadi
 * `emails` kosong sementara `primary_email` ada.
 */
function initialEmails(user) {
    if (user?.emails?.length) return user.emails;
    if (user?.primary_email) return [user.primary_email];
    return [""];
}

/**
 * Isi form-nya. Sengaja dipisah dari dialog supaya bisa DI-REMOUNT.
 *
 * Versi pertama gue nge-reset state pakai useEffect waktu dialog kebuka.
 * Lint nolak, dan alasannya bener: itu bikin render dobel tiap buka, dan
 * gampang salah kalau nanti ada field baru yang kelupaan di-reset.
 *
 * Pola remount lewat `key` di parent ngilangin masalahnya di akar — state-nya
 * bukan "di-reset", tapi memang belum pernah ada. useState initializer yang
 * baca props jadi cukup, dan gak ada effect sama sekali.
 */
function UserForm({ user, onClose }) {
    const isEdit = Boolean(user);

    const [username, setUsername] = useState(user?.username ?? "");
    const [emails, setEmails] = useState(() => initialEmails(user));
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const wantsPasswordChange = !isEdit || password.length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailList = emails.map((em) => em.trim()).filter(Boolean);
        if (emailList.length === 0) {
            toast.error("Email belum diisi", { description: "Minimal satu email, dan yang pertama dipakai buat login." });
            return;
        }

        // Dicek di klien dulu biar feedback-nya instan dan pesannya bahasa kita.
        // Server tetep nolak juga kalau ada yang lolos dari sini.
        if (wantsPasswordChange) {
            if (password.length < MIN_PASSWORD_LENGTH) {
                toast.error("Password kependekan", { description: `Minimal ${MIN_PASSWORD_LENGTH} karakter.` });
                return;
            }
            if (password !== confirmPassword) {
                toast.error("Konfirmasi password gak cocok", { description: "Dua kolom password harus isinya sama." });
                return;
            }
        }

        setIsSaving(true);

        const payload = { username, password, emails: emailList };
        const result = isEdit ? await updateUser(user.id, payload) : await createUser(payload);

        setIsSaving(false);

        if (result?.error) {
            toast.error(isEdit ? "Gagal nyimpen" : "Gagal nambah admin", { description: result.error });
            return;
        }

        toast.success(isEdit ? "Data admin kesimpen" : `Admin "${username}" udah bisa login`);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <FormField label="Username" id="username" required hint="Bisa dipakai buat login, selain email.">
                <Input id="username" type="text" autoComplete="off" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="misal: rangga" className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            <EmailListInput emails={emails} setEmails={setEmails} />

            <PasswordInput label={isEdit ? "Password baru (kosongin kalau gak diganti)" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} required={!isEdit} minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="h-9" />

            {wantsPasswordChange && <PasswordInput label="Ulangi password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="h-9" />}

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Batal
                </Button>
                <Button type="submit" className="font-semibold" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Nyimpen...
                        </>
                    ) : isEdit ? (
                        "Simpen perubahan"
                    ) : (
                        "Bikin admin"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function UserFormDialog({ user = null, open, onOpenChange }) {
    const isEdit = Boolean(user);

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Edit admin" : "Tambah admin"} description={isEdit ? `Ngubah akses untuk ${user.username || user.primary_email}.` : "Bikin akun admin baru yang langsung bisa masuk."} maxWidth="sm:max-w-md">
            {/* `key` yang bikin form-nya fresh tiap ganti target edit,
                dan `open &&` yang mastiin dia gak idup pas dialog ketutup. */}
            {open && <UserForm key={user?.id ?? "new"} user={user} onClose={() => onOpenChange(false)} />}
        </FormDialog>
    );
}
