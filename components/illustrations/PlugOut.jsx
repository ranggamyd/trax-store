/**
 * Ilustrasi buat token Eldorado yang gak kesambung.
 *
 * Dipakai di TokenStatusNotice — keadaan paling sering bikin bingung di app ini,
 * karena penyebabnya di LUAR dashboard (extension belum jalan, atau belum login
 * di eldorado.gg). Gambarnya harus bilang "sambungan ke luar kepotong", bukan
 * "dashboard-nya rusak" — kalau user nyangka yang kedua, dia bakal refresh
 * berkali-kali padahal yang perlu dibuka itu tab lain.
 *
 * Steker dan colokan yang KEDUANYA UTUH tapi gak nyampe itu inti pesannya:
 * gak ada yang pecah, cuma belum ketemu. Percikan di celahnya yang kedip bikin
 * jelas bahwa arusnya udah nyoba nyeberang.
 *
 * `direction` bikin satu gambar kepake buat dua sebab yang beda:
 *   "extension" — kabelnya nyambung ke kiri (sisi dashboard aman, alat bantunya
 *                 yang belum kepasang)
 *   "remote"    — kabelnya nyambung ke kanan (alatnya ada, ujung jauhnya yang
 *                 belum ngasih akses)
 */
export function PlugOut({ className, direction = "extension", ...props }) {
    const isRemote = direction === "remote";

    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="plugOutGlow" cx="80" cy="80" r="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--danger)" stopOpacity="0.15" />
                    <stop offset="1" stopColor="var(--danger)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="80" r="56" fill="url(#plugOutGlow)" />

            {/* ── Steker (kiri) ────────────────────────────────────────────── */}
            <rect x="20" y="62" width="34" height="36" rx="9" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="1.6" />
            {/* Dua kaki kontak */}
            <path d="M54 72h12M54 88h12" stroke="var(--danger)" strokeWidth="3.5" strokeLinecap="round" />
            {/* Kabel — arahnya ikut `direction` */}
            <path d={isRemote ? "M20 80c-8 0-8-26 0-26" : "M20 80c-10 0-10 24 0 24"} stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* ── Colokan (kanan) ──────────────────────────────────────────── */}
            <rect x="106" y="56" width="34" height="48" rx="10" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="1.6" />
            {/* Lubangnya. Gelap total — kosong, bukan mati. */}
            <rect x="114" y="69" width="7" height="6" rx="3" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
            <rect x="114" y="85" width="7" height="6" rx="3" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
            <rect x="128" y="56" width="6" height="48" rx="3" fill="var(--danger)" opacity="0.14" />

            {/* ── Celah kontak ─────────────────────────────────────────────── */}

            {/* Percikan zigzag yang kedip gak beraturan — arusnya nyoba nyeberang
                dan gagal. Kalau kedipnya rata, dia kebaca kayak indikator
                normal yang lagi jalan. */}
            <g style={{ animation: "spark-flicker 1.4s steps(1, end) infinite" }}>
                <path d="M74 66l8 8-6 4 8 8" stroke="var(--danger)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="88" cy="70" r="1.8" fill="var(--danger)" />
                <circle cx="72" cy="90" r="1.5" fill="var(--danger)" opacity="0.7" />
            </g>

            {/* Penanda jarak di bawah — nandain celahnya sebagai ukuran, biar
                mata baca "belum nyampe" bukan "ada yang ilang di tengah" */}
            <path d="M68 116v8M92 116v8M68 120h24" stroke="var(--muted-foreground)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        </svg>
    );
}
