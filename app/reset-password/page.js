"use client";

import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/templates/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

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
            toast.error("Gagal kirim link", { description: error.message });
        } else {
            setIsSent(true);
        }
        setIsLoading(false);
    };

    const backToLogin = (
        <Link href="/login" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Balik ke login
        </Link>
    );

    // State terkirim: tunjukin EMAIL-nya, jangan cuma bilang "berhasil dikirim".
    // Salah ketik email itu penyebab paling umum link reset gak nyampe, dan
    // satu-satunya cara user nyadar adalah kalau alamatnya dibalikin ke dia.
    if (isSent) {
        return (
            <AuthShell title="Cek inbox lu" description="Link reset password-nya udah jalan." footer={backToLogin}>
                <div className="border-success/25 bg-success/[0.07] flex flex-col items-center gap-3 rounded-2xl border p-6 text-center">
                    <div className="border-success/25 bg-success/10 flex h-11 w-11 items-center justify-center rounded-xl border">
                        <MailCheck className="text-success h-5 w-5" />
                    </div>
                    <p className="text-foreground font-mono text-sm font-semibold break-all">{email}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">Belum nyampe dalam 2 menit? Cek folder spam dulu, atau pastiin alamatnya bener.</p>
                </div>

                <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                        setIsSent(false);
                        setEmail("");
                    }}
                >
                    Kirim ke email lain
                </Button>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Reset password" description="Masukin email admin lu, linknya kita kirim." footer={backToLogin}>
            <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Email admin</Label>
                    <Input id="email" type="email" autoComplete="email" placeholder="admin@traxstore.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-10" />
                </div>

                <Button type="submit" size="lg" className="h-11 w-full font-semibold" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ngirim...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Kirim link reset
                        </>
                    )}
                </Button>
            </form>
        </AuthShell>
    );
}
