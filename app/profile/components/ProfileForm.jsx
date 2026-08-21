"use client";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { updateMyProfile } from "@/app/profile/actions";
import { EmailListInput } from "@/components/molecules/EmailListInput";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Form edit profil.
 *
 * BUG YANG DIBENERIN: di versi lama SEMUA toast di halaman ini di-comment out.
 *
 *   // toast.error("Gagal update profil: " + error);
 *   // toast.success("Profil berhasil diperbarui!");
 *
 * Jadi nyimpen profil gak ngasih tanda apa pun — sukses dan gagal kelihatan
 * persis sama: tombolnya balik normal dan udah. Ini bentuk kegagalan paling
 * jahat di form, karena user gak punya alasan buat curiga datanya gak kesimpen.
 */
export function ProfileForm({ profile }) {
    const [username, setUsername] = useState(profile.username);
    const [emails, setEmails] = useState(profile.emails.length ? profile.emails : [""]);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailList = emails.map((em) => em.trim()).filter(Boolean);
        if (emailList.length === 0) {
            toast.error("Email belum diisi", { description: "Minimal satu email — yang pertama dipakai buat login." });
            return;
        }

        setIsSaving(true);
        const result = await updateMyProfile({ username, emails: emailList });
        setIsSaving(false);

        if (result?.error) {
            toast.error("Gagal nyimpen profil", { description: result.error });
            return;
        }

        // Gak perlu setState buat nyegerin tampilan: revalidatePath di server
        // yang ngirim data barunya. Versi lama nambal state lokal manual —
        // dan itu bisa nyimpang dari isi database kalau ada yang gagal separuh.
        toast.success("Profil kesimpen");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Username" id="profile-username" required hint="Nama yang kelihatan di riwayat shift dan daftar admin.">
                <Input id="profile-username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nama panggilan lu" className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9" />
            </FormField>

            <EmailListInput emails={emails} setEmails={setEmails} />

            <Button type="submit" disabled={isSaving} className="font-semibold">
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Nyimpen...
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpen profil
                    </>
                )}
            </Button>
        </form>
    );
}
