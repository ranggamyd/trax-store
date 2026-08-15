"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { GlobalLoading } from "@/components/GlobalLoading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { EmailListInput } from "@/components/molecules/EmailListInput";
import { toast } from "sonner";
import { User, Key, Save } from "lucide-react";
import { updateUser } from "@/app/actions/users";

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [editUsername, setEditUsername] = useState("");
    const [editEmails, setEditEmails] = useState([""]);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const { session, loading } = useAuthGuard((s) => {
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
            toast.error("Gagal update profil: " + error);
        } else {
            toast.success("Profil berhasil diperbarui!");
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
            toast.error(error.message);
        } else {
            toast.success("Password berhasil diubah!");
            setPassword("");
            setConfirmPassword("");
        }
        setIsUpdating(false);
    };

    if (loading || !session) return <GlobalLoading text="Mengecek identitas..." />;

    return (
        <div className="text-foreground min-h-screen bg-black p-8 pb-20">
            <div className="mx-auto max-w-2xl space-y-8">
                <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
                    <div className="bg-primary/20 border-primary/50 flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_0_15px_rgba(248,28,229,0.3)]">
                        <User className="text-primary h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Profil: <span className="neon-text-primary">{profile?.username || "Admin"}</span>
                        </h1>
                        <p className="mt-1 text-zinc-400">
                            Email Utama: <span className="text-white">{profile?.primary_email || session.user.email}</span>
                        </p>
                        {profile?.emails?.length > 1 && <p className="mt-1 text-sm text-zinc-500">Alias: {profile.emails.filter((e) => e !== profile.primary_email).join(", ")}</p>}
                    </div>
                </div>

                <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2 text-xl">
                            <User className="h-5 w-5" /> Edit Profil
                        </CardTitle>
                        <CardDescription className="text-zinc-400">Ubah nama panggilan dan email buat login di markas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="border-zinc-800 bg-zinc-950" placeholder="Nama panggilan..." />
                            </div>
                            <EmailListInput emails={editEmails} setEmails={setEditEmails} primaryPlaceholder="Email Utama" secondaryPlaceholder="Email Cadangan" inputClassName="bg-zinc-950 border-zinc-800" />
                            <Button type="submit" disabled={isSavingProfile} className="bg-primary hover:bg-primary/80 h-12 px-8 font-bold text-white">
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

                <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2 text-xl">
                            <Key className="h-5 w-5" /> Ganti Password
                        </CardTitle>
                        <CardDescription className="text-zinc-400">Ubah password akun kamu di sini. Pastikan pakai password yang kuat.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <PasswordInput label="Password Baru" required value={password} onChange={(e) => setPassword(e.target.value)} className="border-zinc-800 bg-zinc-950" />
                            <PasswordInput label="Konfirmasi Password Baru" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="border-zinc-800 bg-zinc-950" />
                            <Button type="submit" disabled={isUpdating} className="bg-primary hover:bg-primary/80 h-12 px-8 font-bold text-white">
                                {isUpdating ? "Menyimpan..." : "Simpan Password Baru"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
