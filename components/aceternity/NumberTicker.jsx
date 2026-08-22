"use client";

import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * NumberTicker — pola Aceternity/Magic UI, di-port ke JSX.
 *
 * Angka yang naik dari 0 ke nilainya waktu masuk viewport. Bikin statistik
 * kerasa "dihitung", bukan sekadar dicetak.
 *
 * Dua hal yang gue perhatiin, dan dua-duanya bikin komponen ini gak sekadar
 * gimmick:
 *
 *   1. TEKSNYA SELALU ADA DI HTML. Nilai awalnya di-render sebagai angka final
 *      di server (`suppressHydrationWarning` buat jaga-jaga), lalu animasinya
 *      jalan setelah mount. Kalau angkanya baru muncul setelah JS jalan,
 *      statistik penting jadi gak kebaca sama screen reader dan gak ada di
 *      HTML — dan itu harga yang kemahalan buat efek 800ms.
 *
 *   2. `useReducedMotion` dihormatin: kalau user matiin animasi, angkanya
 *      langsung tampil final. Ini yang paling sering kelupaan di komponen
 *      Aceternity — animasinya JS-driven, jadi @media prefers-reduced-motion
 *      di CSS gak nyentuh dia sama sekali.
 */
export function NumberTicker({ value = 0, decimals = 0, prefix = "", suffix = "", duration = 1.2, className }) {
    const ref = useRef(null);
    const shouldReduceMotion = useReducedMotion();

    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, { damping: 30, stiffness: 90, duration: duration * 1000 });
    const isInView = useInView(ref, { once: true, margin: "-40px" });

    const [display, setDisplay] = useState(value);

    useEffect(() => {
        if (shouldReduceMotion) return;
        if (isInView) motionValue.set(value);
    }, [isInView, value, motionValue, shouldReduceMotion]);

    useEffect(() => {
        if (shouldReduceMotion) return;

        const unsubscribe = spring.on("change", (latest) => {
            setDisplay(Number(latest.toFixed(decimals)));
        });

        return unsubscribe;
    }, [spring, decimals, shouldReduceMotion]);

    const shown = shouldReduceMotion ? value : display;

    return (
        <span ref={ref} className={cn("tabular-nums", className)} suppressHydrationWarning>
            {prefix}
            {shown.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
            {suffix}
        </span>
    );
}
