"use client";
import { Key, Save, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { updateUser } from "@/app/actions/users";
import { EmailListInput } from "@/components/molecules/EmailListInput";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { PageContainer } from "@/components/templates/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [editUsername, setEditUsername] = useState("");
    const [editEmails, setEditEmails] = useState([""]);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const { session } = useAuthGuard((s) => {
        supabase
            .from("admin_profiles")
            .select("*")
            .eq("id", s.user.id)
            .single()
            .then(({ data }) => {
                setProfile(data);
                setEditUsername(data?.username || "");
                setEditEmails(data?.emails && data.emails.length > 0 ? data.emails : [s.user.email]);
            });
    });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        const emailList = editEmails.map((em) => em.trim()).filter((em) => em);
        const { error } = await updateUser(session.user.id, {
            username: editUsername,
            password: "",
            emails: emailList,
        });
        if (error) {
            // toast.error("Gagal update profil: " + error);
        } else {
            // toast.success("Profil berhasil diperbarui!");
            setProfile((prev) => ({
                ...prev,
                username: editUsername,
                emails: emailList,
                primary_email: emailList[0],
            }));
        }
        setIsSavingProfile(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error("Password gak sama bro!", {
                description: "Cek lagi konfirmasi password lu.",
            });
        }
        setIsUpdating(true);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            // toast.error(error.message);
        } else {
            // toast.success("Password berhasil diubah!");
            setPassword("");
            setConfirmPassword("");
        }
        setIsUpdating(false);
    };

    return (
        <PageContainer width="compact">
            <div className="border-border bg-surface-2/50 flex items-center gap-4 rounded-2xl border p-6 backdrop-blur-md">
                <div className="bg-primary/20 border-primary/50 flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_0_15px_rgb(124_92_255_/_0.3)]">
                    <User className="text-primary h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-foreground text-2xl font-bold">
                        Profil: <span className="text-glow-primary">{profile?.username || "Admin"}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Email Utama: <span className="text-foreground">{profile?.primary_email || session?.user?.email}</span>
                    </p>
                    {profile?.emails?.length > 1 && <p className="text-muted-foreground mt-1 text-sm">Alias: {profile.emails.filter((e) => e !== profile.primary_email).join(", ")}</p>}
                </div>
            </div>

            <Card className="border-border bg-surface-2/50 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2 text-xl">
                        <User className="h-5 w-5" /> Edit Profil
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Ubah nama panggilan dan email buat login di markas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <Input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="border-border bg-surface-1" placeholder="Nama panggilan..." />
                        </div>
                        <EmailListInput emails={editEmails} setEmails={setEditEmails} primaryPlaceholder="Email Utama" secondaryPlaceholder="Email Cadangan" inputClassName="bg-surface-1 border-border" />
                        <Button type="submit" disabled={isSavingProfile} className="bg-primary hover:bg-primary/80 text-foreground h-12 px-8 font-bold">
                            {isSavingProfile ? (
                                "Menyimpan..."
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" /> Simpan Profil
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-border bg-surface-2/50 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2 text-xl">
                        <Key className="h-5 w-5" /> Ganti Password
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Ubah password akun kamu di sini. Pastikan pakai password yang kuat.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <PasswordInput label="Password Baru" required value={password} onChange={(e) => setPassword(e.target.value)} className="border-border bg-surface-1" />
                        <PasswordInput label="Konfirmasi Password Baru" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="border-border bg-surface-1" />
                        <Button type="submit" disabled={isUpdating} className="bg-primary hover:bg-primary/80 text-foreground h-12 px-8 font-bold">
                            {isUpdating ? "Menyimpan..." : "Simpan Password Baru"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PageContainer>
    );
}
