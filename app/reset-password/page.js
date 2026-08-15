"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gamepad2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/profile`,
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Link reset password udah dikirim!");
            setIsSent(true);
        }
        setIsLoading(false);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-4">
            {/* Background decoration */}
            <div className="bg-primary/20 pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-[120px]" />
            <div className="bg-accent/20 pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="bg-primary/10 neon-border-primary border-primary/50 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border">
                        <Gamepad2 className="text-primary h-8 w-8" />
                    </div>
                    <h2 className="neon-text-primary text-3xl font-bold tracking-widest text-white uppercase">Traxstore</h2>
                    <p className="text-zinc-400">Lupa Password Admin</p>
                </div>

                {isSent ? (
                    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
                        <p className="font-medium text-green-400">Link reset password berhasil dikirim ke email kamu.</p>
                        <p className="text-sm text-zinc-400">Cek inbox atau folder spam, lalu ikuti petunjuk di dalamnya.</p>
                        <Link href="/login" className="mt-4 block">
                            <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800">
                                Kembali ke Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">
                                Email Address
                            </Label>
                            <Input id="email" type="email" placeholder="admin@traxstore.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-zinc-800 bg-zinc-900 text-white" />
                        </div>

                        <Button type="submit" className="bg-primary hover:bg-primary/80 h-12 w-full font-bold text-white" disabled={isLoading}>
                            {isLoading ? "Mengirim link..." : "Kirim Link Reset"}
                        </Button>

                        <div className="text-center">
                            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-white">
                                <ArrowLeft className="h-4 w-4" /> Kembali ke Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
