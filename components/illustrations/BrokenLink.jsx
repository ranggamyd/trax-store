/**
 * Ilustrasi empty state buat RELASI yang belum kejalin.
 *
 * Dipakai di tempat yang datanya bukan "gak ada", tapi "ada dua-duanya, cuma
 * belum disambungin": akun yang belum ditautin ke game, game yang belum ada
 * akunnya.
 *
 * Ini keadaan ketiga yang selama ini dipaksa masuk ke satu gambar bareng dua
 * yang lain. Bedanya nyata buat user: kalau tabelnya kosong karena belum ada
 * data, langkahnya "bikin data". Kalau kosong karena belum ketaut, datanya UDAH
 * ADA di tempat lain dan langkahnya "sambungin" — dua tombol yang beda.
 *
 * Dua node kekunci di tempatnya (bukan pudar atau retak) justru yang bikin
 * pesannya jelas: yang belum ada itu GARISNYA, bukan barangnya.
 */
export function BrokenLink({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="brokenLinkGlow" cx="80" cy="80" r="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--accent)" stopOpacity="0.13" />
                    <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="80" r="58" fill="url(#brokenLinkGlow)" />

            {/* Node kiri — heksagon, sama bahasa bentuknya kayak logo mark */}
            <path d="M42 52 60 62v20L42 92 24 82V62z" fill="var(--accent)" fillOpacity="0.08" />
            <path d="M42 52 60 62v20L42 92 24 82V62z" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="42" cy="72" r="4" fill="var(--accent)" />

            {/* Node kanan */}
            <path d="M118 52 136 62v20l-18 10-18-10V62z" fill="var(--accent)" fillOpacity="0.08" />
            <path d="M118 52 136 62v20l-18 10-18-10V62z" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="118" cy="72" r="4" fill="var(--accent)" />

            {/* Dua ujung kabel yang jalan ke tengah tapi berhenti sebelum ketemu.
                Dash-nya gerak ke dalam — kesan "nyoba nyambung", bukan "putus". */}
            <path d="M62 72h12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" style={{ animation: "dash-march 1.6s linear infinite" }} />
            <path d="M98 72H86" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" style={{ animation: "dash-march 1.6s linear infinite reverse" }} />

            {/* Celahnya. Kurung buka-tutup yang saling ngadep — nunjukin JARAK,
                jadi mata langsung nangkep bahwa ini yang belum kelar. */}
            <path d="M76 65v14M84 65v14" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

            {/* Label bawah: dua bilah sejajar yang belum ketemu, gaung dari celah
                di atas — bikin komposisinya kebaca dari kejauhan. */}
            <rect x="30" y="112" width="34" height="5" rx="2.5" fill="var(--foreground)" opacity="0.1" />
            <rect x="96" y="112" width="34" height="5" rx="2.5" fill="var(--foreground)" opacity="0.1" />
            <path d="M70 114.5h20" stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
        </svg>
    );
}
