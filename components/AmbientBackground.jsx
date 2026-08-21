/**
 * Latar ambient yang gantiin CursorTrail.
 *
 * Kenapa ini lebih baik dari yang lama:
 *   - SERVER COMPONENT. Nol byte JavaScript ke browser (CursorTrail ~2KB + rAF).
 *   - Nol requestAnimationFrame. Yang lama nge-repaint canvas seukuran viewport
 *     tiap frame, selamanya, walau mouse-nya diem.
 *   - Animasinya cuma transform/opacity, jadi dikerjain compositor. Main thread
 *     bebas ngurus tabel dan form.
 *   - Otomatis mati kalau user nyalain "reduce motion" (diatur di globals.css).
 *
 * Empat lapis, dari belakang ke depan: dasar -> aurora -> grid -> grain.
 * Grain-nya yang bikin gradient gak kelihatan seperti "banding" di layar murah.
 */
export function AmbientBackground() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            {/* 1. Dasar */}
            <div className="bg-background absolute inset-0" />

            {/* 2. Aurora — dua blob, durasi & arah beda biar polanya gak kebaca berulang */}
            <div
                className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] rounded-full blur-[130px] will-change-transform"
                style={{
                    background: "radial-gradient(circle at 35% 35%, var(--brand-from), transparent 70%)",
                    opacity: 0.2,
                    animation: "aurora-drift 32s ease-in-out infinite",
                }}
            />
            <div
                className="absolute -right-[15%] -bottom-[25%] h-[65vh] w-[65vw] rounded-full blur-[140px] will-change-transform"
                style={{
                    background: "radial-gradient(circle at 65% 65%, var(--brand-to), transparent 72%)",
                    opacity: 0.14,
                    animation: "aurora-drift 41s ease-in-out infinite reverse",
                }}
            />
            <div
                className="absolute top-[35%] left-[45%] h-[45vh] w-[45vw] rounded-full blur-[150px] will-change-transform"
                style={{
                    background: "radial-gradient(circle, var(--accent), transparent 70%)",
                    opacity: 0.07,
                    animation: "aurora-drift 55s ease-in-out infinite",
                }}
            />

            {/* 3. Grid teknis — di-mask biar makin ke bawah makin ilang, gak jadi wallpaper */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                    opacity: 0.03,
                    maskImage: "radial-gradient(ellipse 90% 55% at 50% 0%, #000 25%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 90% 55% at 50% 0%, #000 25%, transparent 100%)",
                }}
            />

            {/* 4. Grain — SVG murni, gak ada file gambar yang perlu diunduh */}
            <svg className="absolute inset-0 h-full w-full mix-blend-overlay" style={{ opacity: 0.035 }}>
                <filter id="trax-grain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#trax-grain)" />
            </svg>

            {/* 5. Garis rambut di paling atas — nandain "tepi" viewport, bikin kerasa berlapis */}
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, var(--glass-highlight) 25%, var(--glass-highlight) 75%, transparent)" }} />
        </div>
    );
}
