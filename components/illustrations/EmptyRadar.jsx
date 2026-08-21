/**
 * Ilustrasi empty state: radar yang muter tapi gak nemu apa-apa.
 *
 * Kenapa radar, bukan "kotak kosong": metafora radar itu bilang "gue UDAH
 * NYARI dan gak nemu", bukan "gak ada apa-apa di sini". Bedanya penting —
 * yang pertama ngasih tau user sistemnya jalan, yang kedua kelihatan rusak.
 *
 * Sapuannya animasi CSS murni (transform: rotate), jadi nol JavaScript.
 * Kalau user nyalain reduce-motion, aturan global di globals.css yang matiin.
 */
export function EmptyRadar({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <linearGradient id="radarSweep" x1="80" y1="80" x2="80" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary)" stopOpacity="0.55" />
                    <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="radarGlow" cx="80" cy="80" r="62" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary)" stopOpacity="0.14" />
                    <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="80" r="62" fill="url(#radarGlow)" />

            {/* Cincin konsentris — makin ke luar makin samar, ngasih kesan kedalaman */}
            <circle cx="80" cy="80" r="60" stroke="var(--border)" strokeWidth="1" />
            <circle cx="80" cy="80" r="42" stroke="var(--border)" strokeWidth="1" opacity="0.7" />
            <circle cx="80" cy="80" r="24" stroke="var(--border)" strokeWidth="1" opacity="0.45" />

            {/* Silang sumbu */}
            <path d="M80 20v120M20 80h120" stroke="var(--border)" strokeWidth="1" opacity="0.5" />

            {/* Sapuan yang muter */}
            <g style={{ transformOrigin: "80px 80px", animation: "radar-sweep 4s linear infinite" }}>
                <path d="M80 80 80 20 A60 60 0 0 1 122 38 Z" fill="url(#radarSweep)" />
                <path d="M80 80 80 20" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Titik tengah */}
            <circle cx="80" cy="80" r="3" fill="var(--primary)" />
            <circle cx="80" cy="80" r="7" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />

            {/* Beberapa blip mati — bikin radarnya kerasa hidup tanpa nyaranin ada data */}
            <circle cx="118" cy="52" r="1.5" fill="var(--muted-foreground)" opacity="0.35" />
            <circle cx="46" cy="106" r="1.5" fill="var(--muted-foreground)" opacity="0.25" />
            <circle cx="104" cy="114" r="1.5" fill="var(--muted-foreground)" opacity="0.3" />
        </svg>
    );
}
