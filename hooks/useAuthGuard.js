"use client";

import { useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";

/**
 * Nyediain session yang udah kebaca + trigger fetch data awal halaman.
 *
 * NAMANYA SEKARANG AGAK BOHONG, dan itu disengaja biar 6 pemanggilnya gak perlu
 * disentuh: hook ini UDAH BUKAN penjaga rute. Proteksi rute pindah ke proxy.js,
 * yang nendang di edge sebelum halaman ini kerender sama sekali.
 *
 * Yang dibenerin dari versi lama:
 *
 * 1. `router.push("/login")` DICABUT. Itu jadi kode mati begitu proxy.js ada,
 *    dan justru berbahaya: redirect di klien baru jalan SETELAH halaman
 *    terproteksi kerender, jadi isinya sempat kelihatan sekejap.
 *
 * 2. `setLoading(false)` sekarang SELALU kepanggil. Di versi lama dia cuma
 *    dipanggil di jalur "ada session" — jadi kalau session-nya kosong atau
 *    fetch-nya gagal, halaman nyangkut di skeleton selamanya.
 *
 * 3. Ada cleanup. Dulu kalau user pindah halaman pas fetch masih jalan,
 *    setState-nya nembak komponen yang udah dibongkar.
 *
 * 4. `/* eslint-disable exhaustive-deps *\/` di file ini ilang. Callback-nya
 *    disimpen di ref (bukan di deps), jadi identitas fungsinya yang berubah
 *    tiap render gak lagi bikin fetch jalan berulang.
 */
export function useAuthGuard(onAuthenticated, deps = []) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const callbackRef = useRef(onAuthenticated);
    useEffect(() => {
        callbackRef.current = onAuthenticated;
    }, [onAuthenticated]);

    // deps-nya array literal yang dibikin ulang tiap render, jadi dia gak bisa
    // dipakai langsung sebagai dependency. Diserialisasi biar perbandingannya
    // by value — ini yang bikin `[params.id]` berfungsi seperti yang diharapkan.
    const depsKey = JSON.stringify(deps);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            // getSession() baca cookie secara lokal (bukan panggilan jaringan),
            // dan cuma nembak server kalau tokennya perlu di-refresh.
            const {
                data: { session: current },
            } = await supabase.auth.getSession();

            if (cancelled) return;
            setSession(current);

            try {
                await callbackRef.current?.(current);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();

        return () => {
            cancelled = true;
        };
    }, [depsKey]);

    return { session, loading, setLoading };
}
