"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * CardSpotlight — Aceternity UI, di-port ke JSX.
 *
 * Kartu berkaca dengan sorotan radial yang ngikutin kursor. Efeknya bikin
 * permukaan kaca kerasa punya kedalaman: cahayanya kelihatan mantul dari
 * posisi mouse, bukan cuma gradient statis.
 *
 * Yang gue ubah dari versi aslinya:
 *
 *   - Aslinya pakai `useMotionValue` + komponen canvas efek partikel. Di
 *     dashboard yang bisa nampilin 20+ kartu sekaligus, itu 20 canvas dengan
 *     rAF masing-masing. Di sini cukup satu radial-gradient CSS yang digeser
 *     lewat CSS custom property — nol rAF, nol canvas.
 *
 *   - `pointer-events-none` di lapisan sorotannya. Versi aslinya gak, dan itu
 *     bikin tombol di dalam kartu susah diklik di beberapa browser.
 *
 *   - Sorotannya baru nyala waktu di-hover, dan matinya pakai transition —
 *     jadi gak "nyeplak" ilang waktu kursor keluar.
 *
 *   - Perangkat sentuh gak punya hover, jadi di HP kartunya cuma glass biasa.
 *     Itu disengaja, bukan kurang: sorotan yang nyangkut di posisi terakhir
 *     sentuhan malah kelihatan seperti bug.
 */
export function CardSpotlight({ children, className, radius = 320, color = "var(--primary)", as: Component = "div", ...props }) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };

    return (
        <Component className={cn("group glass relative overflow-hidden rounded-2xl", className)} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} {...props}>
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, color-mix(in oklab, ${color} 12%, transparent), transparent 70%)`,
                }}
            />
            <div className="relative">{children}</div>
        </Component>
    );
}
