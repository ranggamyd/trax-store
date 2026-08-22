"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * HoverBorderGradient — Aceternity UI, di-port ke JSX.
 *
 * Tombol dengan border gradient yang muter. Dipakai buat SATU aksi utama per
 * layar — kalau semua tombol begini, gak ada yang menonjol lagi.
 *
 * Yang gue ubah dari versi aslinya:
 *
 *   - Aslinya nyimpen arah rotasi di state dan nge-update pakai setInterval
 *     tiap detik supaya gradient-nya "muter". Itu setInterval per tombol,
 *     jalan terus walau tombolnya gak di-hover. Di sini rotasinya CSS
 *     keyframe (`border-spin`) yang cuma jalan saat hover — nol timer JS.
 *
 *   - Warna dari token, bukan `#3275F8` hardcode.
 *
 *   - `as` prop biar bisa jadi <button> atau <Link> tanpa markup ganda.
 */
export function HoverBorderGradient({ children, className, containerClassName, as: Component = "button", duration = 2.4, ...props }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Component className={cn("relative isolate inline-flex overflow-hidden rounded-full p-px", containerClassName)} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} {...props}>
            {/* Lapisan gradient yang muter. Kotaknya sengaja jauh lebih gede dari
                tombolnya (aspect-square + 200%) supaya sudutnya gak keliatan
                waktu diputar. */}
            <span
                className="absolute inset-[-100%] -z-10"
                style={{
                    background: `conic-gradient(from 0deg, transparent 0%, var(--brand-from) 25%, var(--brand-to) 50%, transparent 75%)`,
                    animation: `border-spin ${duration}s linear infinite`,
                    animationPlayState: isHovered ? "running" : "paused",
                    opacity: isHovered ? 1 : 0.45,
                    transition: "opacity 250ms",
                }}
            />

            <span className={cn("bg-surface-2 text-foreground relative z-10 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", "group-hover:bg-surface-3", className)}>{children}</span>
        </Component>
    );
}
