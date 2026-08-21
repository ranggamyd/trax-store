"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { resolveLoginIdentifier } from "@/app/actions/users";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { AuthShell } from "@/components/templates/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { email: resolvedEmail } = await resolveLoginIdentifier(identifier);
        const { error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });

        if (error) {
            // Cuma kasus kredensial salah yang digenerikin — pesan asli Supabase
            // ("Invalid login credentials") kedengeran kayak error sistem.
            // Error LAIN tetep ditampilin apa adanya: "Email not confirmed" atau
            // rate limit itu justru info yang bikin admin tau harus ngapain, dan
            // nutup semuanya jadi satu pesan bikin masalah nyata jadi gak kebaca.
            const isBadCredentials = error.message?.toLowerCase().includes("invalid login credentials");

            toast.error("Gak bisa masuk", {
                description: isBadCredentials ? "Username atau password-nya salah. Coba cek lagi." : error.message,
            });
            setLoading(false);
        } else {
            // proxy.js nyimpen tujuan awal di ?next= waktu nendang ke login.
            // Cuma terima path relatif: "//evil.com" itu URL protocol-relative
            // yang bakal jadi open redirect kalau diloloskan.
            const requested = new URLSearchParams(window.location.search).get("next");
            const destination = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

            router.push(destination);
            router.refresh();
        }
    };

    return (
        <AuthShell
            title="Masuk ke markas"
            description="Akses khusus admin Traxstore."
            footer={
                <p className="text-muted-foreground text-xs">
                    Belum punya akses? <span className="text-foreground/80">Minta admin lain bikinin akun lu.</span>
                </p>
            }
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="identifier">Username atau email</Label>
                    <Input id="identifier" type="text" autoComplete="username" placeholder="admin123 atau admin@traxstore.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-10" />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/reset-password" tabIndex={-1} className="text-primary text-xs transition-opacity hover:opacity-80">
                            Lupa password?
                        </Link>
                    </div>
                    <PasswordInput id="password" label={null} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={1} autoComplete="current-password" className="h-10" />
                </div>

                <Button type="submit" size="lg" className="group h-11 w-full font-semibold" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Bentar, dicek dulu...
                        </>
                    ) : (
                        <>
                            Gass masuk
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                    )}
                </Button>
            </form>
        </AuthShell>
    );
}
