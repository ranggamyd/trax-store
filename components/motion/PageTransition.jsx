"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { DURATION, EASE } from "@/lib/motion";

/**
 * Transisi antar halaman.
 *
 * Sengaja ENTER-ONLY, gak pakai AnimatePresence buat exit. Alasannya:
 * di App Router, navigasi itu nge-swap React tree secara streaming, dan
 * AnimatePresence gak bisa nahan halaman lama sampai animasi keluarnya kelar.
 * Yang biasa kejadian kalau dipaksa: konten kedip, atau layout ganda sekejap.
 *
 * Enter-only justru KERASA LEBIH CEPET. Exit animation itu waktu mati —
 * user udah minta pindah halaman, dia gak mau nungguin yang lama pamitan.
 *
 * `key={pathname}` yang bikin animasinya ngulang tiap ganti route.
 */
export function PageTransition({ children }) {
    const pathname = usePathname();
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) return children;

    return (
        <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.base, ease: EASE.out }}>
            {children}
        </motion.div>
    );
}
