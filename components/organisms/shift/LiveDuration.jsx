"use client";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/utils";

/**
 * Timer shift yang jalan.
 *
 * Satu-satunya bagian ShiftOverview yang harus client — sisanya HTML server.
 *
 * `initialValue` dihitung di server dan dipakai sebagai state awal, BUKAN
 * dihitung ulang saat render pertama di klien. Ini yang nyegah hydration
 * mismatch: kalau nilai awalnya dihitung dari `Date.now()` di klien, dia bakal
 * beda beberapa ratus milidetik dari yang dirender server, dan React ngeluh
 * markup-nya gak cocok.
 *
 * Interval-nya baru mulai setelah mount, jadi render pertama identik dua sisi.
 */
export function LiveDuration({ startedAt, initialValue, className }) {
    const [duration, setDuration] = useState(initialValue);

    useEffect(() => {
        if (!startedAt) return;

        const tick = () => setDuration(formatDuration(startedAt));

        // Sinkronin sekali begitu mount, biar selisih latensi request ke-koreksi.
        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    return (
        <span className={className} suppressHydrationWarning>
            {duration}
        </span>
    );
}
