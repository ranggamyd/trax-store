import { KeyRound, UserRound } from "lucide-react";

import { PasswordForm } from "@/app/profile/components/PasswordForm";
import { ProfileForm } from "@/app/profile/components/ProfileForm";
import { getMyProfile } from "@/app/profile/queries";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

export const metadata = {
    title: "Profil",
};

/** SERVER COMPONENT. */
export default async function ProfilePage() {
    const profile = await getMyProfile();

    // proxy.js udah mastiin ada session sebelum halaman ini kesentuh, jadi ini
    // cuma jaring buat kasus aneh (baris auth kehapus pas session masih hidup).
    if (!profile) {
        return (
            <PageContainer width="compact">
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-2xl border p-4 text-sm" role="alert">
                    Gagal baca profil lu. Coba logout terus login lagi.
                </div>
            </PageContainer>
        );
    }

    const aliases = profile.emails.filter((email) => email !== profile.primary_email);

    return (
        <PageContainer width="compact">
            <PageHeader
                title={profile.username || "Belum ada nama"}
                eyebrow="Akun lu"
                subtitle={profile.primary_email}
                icon={UserRound}
                rightContent={
                    <div className="flex items-center gap-3">
                        {!profile.has_profile && <StatusBadge variant="warning">Profil belum diisi</StatusBadge>}
                        <div className="border-primary/25 bg-primary/12 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-bold" style={{ boxShadow: "var(--glow-primary)" }}>
                            {getInitials(profile.username || profile.primary_email)}
                        </div>
                    </div>
                }
            />

            {aliases.length > 0 && (
                <p className="text-muted-foreground text-xs">
                    Email cadangan: <span className="text-foreground/85 font-mono">{aliases.join(", ")}</span>
                </p>
            )}

            <Card className="glass-subtle">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                        <UserRound className="text-primary h-4 w-4" />
                        Data profil
                    </CardTitle>
                    <CardDescription>Nama panggilan dan email yang bisa lu pakai buat masuk.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* key dari data server: kalau profil di-revalidate, form-nya
                        ikut fresh dan gak nyisa nilai lama di state lokal. */}
                    <ProfileForm key={`${profile.username}-${profile.emails.join(",")}`} profile={profile} />
                </CardContent>
            </Card>

            <Card className="glass-subtle">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                        <KeyRound className="text-primary h-4 w-4" />
                        Ganti password
                    </CardTitle>
                    <CardDescription>Minimal 6 karakter. Berlaku mulai login berikutnya.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PasswordForm />
                </CardContent>
            </Card>
        </PageContainer>
    );
}
