"use client";

import { motion, useReducedMotion } from "framer-motion";

import { DURATION, EASE } from "@/lib/motion";

const OFFSET = {
    up: { y: 16, x: 0 },
    down: { y: -16, x: 0 },
    left: { y: 0, x: 16 },
    right: { y: 0, x: -16 },
    none: { y: 0, x: 0 },
};

/**
 * Munculin anaknya dengan fade + geser dikit.
 *
 * `whileInView` dipakai (bukan animate biasa) supaya konten yang jauh di bawah
 * fold gak kelewat animasinya sebelum kelihatan — user scroll ke bawah dan
 * nemu elemen yang udah selesai animasi itu kerasa mati.
 *
 * PENTING soal reduced-motion: aturan @media di globals.css cuma matiin
 * transition/animation CSS. Framer Motion nulis transform lewat inline style
 * dari JS, jadi media query itu GAK nyentuh dia. Makanya harus dicek manual
 * pakai useReducedMotion — kalau nggak, setelan aksesibilitas user diabaikan.
 */
export function Reveal({ children, direction = "up", delay = 0, duration = DURATION.base, once = true, className, ...props }) {
    const shouldReduceMotion = useReducedMotion();
    const offset = OFFSET[direction] ?? OFFSET.up;

    if (shouldReduceMotion) {
        return (
            <div className={className} {...props}>
                {children}
            </div>
        );
    }

    return (
        <motion.div className={className} initial={{ opacity: 0, ...offset }} whileInView={{ opacity: 1, y: 0, x: 0 }} viewport={{ once, margin: "-64px" }} transition={{ duration, delay, ease: EASE.out }} {...props}>
            {children}
        </motion.div>
    );
}
