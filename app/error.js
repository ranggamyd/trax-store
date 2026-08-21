"use client";

import { House, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { SignalLost } from "@/components/illustrations/SignalLost";
import { StatusScreen } from "@/components/templates/StatusScreen";
import { Button } from "@/components/ui/button";

/**
 * Error boundary untuk seluruh app.
 *
 * Sebelum ini GAK ADA sama sekali — satu throw di komponen mana pun bikin
 * layar putih kosong tanpa jalan keluar, dan satu-satunya cara balik adalah
 * ngetik ulang URL. Untuk dashboard yang dipakai kerja, itu fatal.
 *
 * `reset()` dari Next nyoba nge-render ulang segmen yang gagal TANPA reload
 * penuh. Ini yang bikin bedanya kerasa: kalau errornya cuma fetch yang
 * ngadat sekali, klik "Coba lagi" langsung pulih dan state halaman lain
 * tetep utuh — gak perlu login ulang atau ngisi form dari nol.
 */
export default function GlobalErrorBoundary({ error, reset }) {
    useEffect(() => {
        // Sengaja tetep di-log: pesan yang diliat user disederhanain,
        // jadi console harus tetep nyimpen yang aslinya buat debugging.
        console.error("[error boundary]", error);
    }, [error]);

    // Session Supabase abis -> arahkan ke login, bukan ke "coba lagi".
    // Nyuruh user nyoba lagi padahal masalahnya autentikasi itu jalan buntu.
    const isAuthError = error?.message === "UNAUTHORIZED";

    return (
        <StatusScreen
            illustration={<SignalLost className="h-40 w-40" />}
            code={isAuthError ? "Sesi berakhir" : "Ada yang ngadat"}
            title={isAuthError ? "Sesi lu udah abis" : "Koneksinya kepotong di tengah jalan"}
            hint={isAuthError ? "Login sekali lagi dan lu bakal balik ke halaman ini." : "Biasanya ini cuma request yang gagal sekali. Klik coba lagi — sembilan dari sepuluh kasus langsung pulih."}
            detail={error?.digest ? `digest: ${error.digest}\n${error?.message ?? ""}` : error?.message}
            actions={
                isAuthError ? (
                    <Link href="/login">
                        <Button size="lg" className="font-semibold">
                            Login ulang
                        </Button>
                    </Link>
                ) : (
                    <>
                        <Button size="lg" className="font-semibold" onClick={() => reset()}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Coba lagi
                        </Button>
                        <Link href="/">
                            <Button size="lg" variant="outline">
                                <House className="mr-2 h-4 w-4" />
                                Balik ke dashboard
                            </Button>
                        </Link>
                    </>
                )
            }
        />
    );
}
