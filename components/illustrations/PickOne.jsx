/**
 * Ilustrasi buat panel kanan yang belum ada isinya di layout split.
 *
 * Dipakai di /orders dan /offers. Sebelum ini panel kanan yang lebar itu cuma
 * ada satu baris teks abu-abu di tengahnya — kadang cuma teks, tanpa apa pun
 * lagi. Buat panel yang makan separuh layar, itu kelihatan kayak halamannya
 * gagal ngerender, bukan kayak instruksi.
 *
 * Metaforanya HARFIAH: gambarnya nirukan layout halamannya sendiri — tumpukan
 * kartu di kiri, panel kosong di kanan, panah dari satu kartu ke panel itu.
 * Ilustrasi harfiah biasanya pilihan males, tapi di sini justru paling kuat:
 * user langsung nyocokin gambarnya sama apa yang dia liat di layar, jadi
 * "di kiri" gak perlu dibaca dua kali buat ngerti kiri yang mana.
 *
 * Panahnya gerak dikit ke kanan — arah, bukan dekorasi.
 */
export function PickOne({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="pickOneGlow" cx="80" cy="80" r="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--accent)" stopOpacity="0.12" />
                    <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="80" r="58" fill="url(#pickOneGlow)" />

            {/* ── Kolom kiri: tumpukan kartu ───────────────────────────────── */}

            {/* Dua kartu biasa, redup */}
            <rect x="20" y="42" width="44" height="20" rx="6" fill="var(--foreground)" fillOpacity="0.04" stroke="var(--border)" strokeWidth="1" />
            <rect x="26" y="48" width="18" height="3" rx="1.5" fill="var(--foreground)" opacity="0.16" />
            <rect x="26" y="54" width="28" height="3" rx="1.5" fill="var(--foreground)" opacity="0.09" />

            <rect x="20" y="98" width="44" height="20" rx="6" fill="var(--foreground)" fillOpacity="0.04" stroke="var(--border)" strokeWidth="1" />
            <rect x="26" y="104" width="22" height="3" rx="1.5" fill="var(--foreground)" opacity="0.16" />
            <rect x="26" y="110" width="26" height="3" rx="1.5" fill="var(--foreground)" opacity="0.09" />

            {/* Kartu yang kepilih — accent, plus bilah di tepi kiri kayak
                penanda "row aktif" yang beneran dipakai di tabelnya */}
            <rect x="20" y="70" width="44" height="20" rx="6" fill="var(--accent)" fillOpacity="0.12" stroke="var(--accent)" strokeWidth="1.6" />
            <rect x="20" y="74" width="2.5" height="12" rx="1.25" fill="var(--accent)" />
            <rect x="28" y="76" width="20" height="3" rx="1.5" fill="var(--accent)" opacity="0.85" />
            <rect x="28" y="82" width="28" height="3" rx="1.5" fill="var(--accent)" opacity="0.45" />

            {/* ── Panah penunjuk ───────────────────────────────────────────── */}
            <g style={{ animation: "nudge-x 2.4s ease-in-out infinite" }}>
                <path d="M70 80h14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                <path d="M80 74.5 86 80l-6 5.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* ── Panel kanan: masih kosong ────────────────────────────────── */}
            <rect x="94" y="38" width="46" height="84" rx="9" stroke="var(--border)" strokeWidth="1.6" strokeDasharray="7 7" strokeLinecap="round" />

            {/* Rangka isi yang samar — nunjukin bakal ada apa di situ, jadi
                panelnya kebaca "nunggu data", bukan "sengaja dibiarin kosong" */}
            <rect x="102" y="48" width="24" height="4" rx="2" fill="var(--foreground)" opacity="0.12" />
            <rect x="102" y="58" width="30" height="3" rx="1.5" fill="var(--foreground)" opacity="0.07" />
            <rect x="102" y="66" width="18" height="3" rx="1.5" fill="var(--foreground)" opacity="0.07" />
            <rect x="102" y="82" width="30" height="3" rx="1.5" fill="var(--foreground)" opacity="0.07" />
            <rect x="102" y="90" width="24" height="3" rx="1.5" fill="var(--foreground)" opacity="0.07" />
            <rect x="102" y="106" width="30" height="8" rx="4" fill="var(--accent)" opacity="0.12" />
        </svg>
    );
}
