/**
 * Ilustrasi buat error state / not-found.
 *
 * Metaforanya "sinyal ilang", bukan "sistem meledak". Bedanya penting buat
 * dashboard internal: yang pertama nyaranin coba lagi, yang kedua nyaranin
 * panggil developer. Sembilan dari sepuluh error di sini cuma butuh refresh.
 *
 * Bar yang tinggal separuh + kotak glitch yang bergeser sedikit ngasih kesan
 * "koneksinya kepotong di tengah jalan". Statis — nol animasi, nol JS: layar
 * error bukan tempat pamer gerakan.
 */
export function SignalLost({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="signalGlow" cx="80" cy="86" r="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--danger)" stopOpacity="0.16" />
                    <stop offset="1" stopColor="var(--danger)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="86" r="58" fill="url(#signalGlow)" />

            {/* Busur sinyal: dua yang deket masih nyala, dua yang jauh mati */}
            <path d="M62 74a26 26 0 0 1 36 0" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 60a44 44 0 0 1 60 0" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
            <path d="M38 46a62 62 0 0 1 84 0" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 9" />

            {/* Titik pusat */}
            <circle cx="80" cy="88" r="5" fill="var(--danger)" />

            {/* Potongan glitch: dua bilah yang bergeser horizontal, khas frame yang
                keburu ke-render sebelum datanya nyampe */}
            <rect x="44" y="112" width="46" height="5" rx="2.5" fill="var(--foreground)" opacity="0.12" />
            <rect x="52" y="122" width="64" height="5" rx="2.5" fill="var(--foreground)" opacity="0.08" />
            <rect x="66" y="132" width="30" height="5" rx="2.5" fill="var(--danger)" opacity="0.35" />

            {/* Garis potong — nandain "kepotong", bukan "kosong" */}
            <path d="M28 100h34M98 100h34" stroke="var(--border)" strokeWidth="1" />
            <path d="M70 96l20 8M70 104l20-8" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
    );
}
