"use client";

import "./globals.css";

import { useEffect } from "react";

/**
 * Jaring terakhir: error yang kejadian DI ROOT LAYOUT itu sendiri.
 *
 * Kenapa perlu terpisah dari error.js: error.js dirender DI DALAM root layout.
 * Kalau yang meledak justru root layout-nya (provider, font, atau globals.css),
 * error.js gak pernah kepanggil — dan user cuma dapet layar putih.
 *
 * Makanya file ini WAJIB nulis <html> dan <body>-nya sendiri: dia gantiin
 * root layout, bukan nempel di dalamnya. Konsekuensinya juga: Navbar dan
 * AmbientBackground gak ada di sini, jadi styling-nya ditulis manual dan
 * dijaga tetep minimal — makin sedikit yang bisa gagal di halaman error,
 * makin bagus.
 */
export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error("[global error boundary]", error);
    }, [error]);

    return (
        <html lang="id" className="dark">
            <body className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                    <p className="text-danger mb-3 font-mono text-[11px] font-bold tracking-[0.2em] uppercase">Gagal total</p>

                    <h1 className="text-2xl font-semibold tracking-tight">App-nya gagal start</h1>

                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">Ini bukan error biasa — yang gagal justru kerangka aplikasinya. Reload dulu; kalau masih sama, kabarin developer sambil sebut kode di bawah.</p>

                    {error?.digest && <p className="text-muted-foreground border-border bg-surface-1 mt-6 inline-block rounded-lg border px-3 py-1.5 font-mono text-[11px]">digest: {error.digest}</p>}

                    <div className="mt-8">
                        <button type="button" onClick={() => reset()} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors">
                            Reload aplikasi
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
