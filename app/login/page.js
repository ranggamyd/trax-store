"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolveLoginIdentifier } from "@/app/actions/users";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/molecules/PasswordInput";
import { toast } from "sonner";
import Link from "next/link";

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
            toast.error("Waduh, gagal login nih.", { description: error.message });
            setLoading(false);
        } else {
            toast.success("Welcome bossku!", { description: "Gass ngabers" });
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-4">
            <div className="bg-primary/20 pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

            <Card className="border-primary/50 relative z-10 w-full max-w-md bg-black/60 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="neon-text-primary text-3xl font-bold tracking-wider uppercase">Traxstore</CardTitle>
                    <CardDescription className="text-zinc-400">Masuk ke Markas Besar Admin</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Username atau Email Admin</Label>
                            <Input id="identifier" type="text" placeholder="Contoh: admin123 atau admin@traxstore.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="focus-visible:ring-primary focus-visible:border-primary border-zinc-800 bg-zinc-900" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password Rahasia</Label>
                                <Link href="/reset-password" tabIndex={-1} className="text-primary hover:text-primary/80 text-xs transition-colors">
                                    Lupa Password?
                                </Link>
                            </div>
                            <PasswordInput label={null} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="" minLength={1} className="focus-visible:ring-primary focus-visible:border-primary border-zinc-800 bg-zinc-900" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 w-full font-bold tracking-wide text-white" disabled={loading}>
                            {loading ? "Tunggu bentar..." : "Gass Masuk"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
