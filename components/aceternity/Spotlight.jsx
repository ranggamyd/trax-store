import { cn } from "@/lib/utils";

/**
 * Spotlight — Aceternity UI, di-port ke JSX.
 *
 * Sorotan cahaya miring yang masuk pelan dari kiri atas. Dipakai di halaman
 * auth: satu titik terang yang narik mata ke kartu login.
 *
 * Yang gue ubah dari versi aslinya:
 *   - SERVER COMPONENT. Aslinya `"use client"` padahal gak ada state, gak ada
 *     event — cuma SVG dan satu animasi CSS. Nol alasan dikirim sebagai JS.
 *   - Warnanya dari token (`--brand-from`), bukan `fill-white` hardcode. Jadi
 *     dia ikut kalau palet berubah.
 *   - Animasinya CSS keyframe, bukan class `animate-spotlight` bawaan mereka
 *     yang butuh konfigurasi tailwind.config — dan project ini Tailwind v4,
 *     yang udah gak pakai file config itu.
 */
export function Spotlight({ className, fill }) {
    return (
        <svg className={cn("pointer-events-none absolute z-0 h-[169%] w-[138%] opacity-0 lg:w-[84%]", className)} style={{ animation: "spotlight-in 2s ease 0.5s 1 forwards" }} viewBox="0 0 3787 2842" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g filter="url(#spotlight-blur)">
                <ellipse cx="1924.71" cy="273.501" rx="1924.71" ry="273.501" transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)" fill={fill ?? "var(--brand-from)"} fillOpacity="0.2" />
            </g>
            <defs>
                <filter id="spotlight-blur" x="0.860352" y="0.838989" width="3785.16" height="2840.26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
                </filter>
            </defs>
        </svg>
    );
}
