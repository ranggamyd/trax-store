/**
 * Ilustrasi buat notifikasi yang KOSONG KARENA UDAH KELAR.
 *
 * Ini satu-satunya empty state di app yang bukan kekurangan. Kotak notifikasi
 * kosong itu KABAR BAGUS — semuanya udah kebaca. Jadi gambarnya gak boleh minjem
 * bahasa visual empty state yang lain: bukan abu-abu, bukan garis putus-putus,
 * bukan radar yang gak nemu apa-apa. Semua itu ngasih rasa "ada yang kurang".
 *
 * Metaforanya ping yang udah kelar nyebar: cincin yang udah melebar penuh dan
 * memudar, centang di tengahnya. Warnanya success, bukan muted.
 *
 * SENGAJA DIEM TOTAL — nol animasi. Ini keadaan tenang, dan gerakan apa pun
 * ngebantah pesannya: cincin yang masih gerak berarti masih ada yang datang.
 */
export function InboxZero({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="inboxZeroGlow" cx="80" cy="80" r="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--success)" stopOpacity="0.15" />
                    <stop offset="1" stopColor="var(--success)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="80" r="58" fill="url(#inboxZeroGlow)" />

            {/* Cincin yang udah melebar penuh terus habis. Opasitasnya turun
                makin ke luar — bukan gradient, tapi tiga nilai eksplisit, biar
                urutannya kebaca sebagai "yang ini duluan, yang itu belakangan". */}
            <circle cx="80" cy="80" r="56" stroke="var(--success)" strokeWidth="1" opacity="0.1" />
            <circle cx="80" cy="80" r="43" stroke="var(--success)" strokeWidth="1" opacity="0.18" />
            <circle cx="80" cy="80" r="30" stroke="var(--success)" strokeWidth="1.2" opacity="0.32" />

            {/* Piringan tengah — solid, jadi centangnya punya bidang buat berdiri */}
            <circle cx="80" cy="80" r="20" fill="var(--success)" fillOpacity="0.12" />
            <circle cx="80" cy="80" r="20" stroke="var(--success)" strokeWidth="1.8" />

            {/* Centangnya. strokeLinejoin round bikin sudutnya gak nyeplak
                di ukuran kecil. */}
            <path d="M71 80.5 77.5 87 90 74" stroke="var(--success)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Tiga bilah yang makin pendek ke bawah — tumpukan yang udah abis
                dibersihin. Ini yang bikin bedanya sama "belum pernah ada apa-apa":
                jejaknya masih keliatan. */}
            <rect x="58" y="116" width="44" height="4.5" rx="2.25" fill="var(--success)" opacity="0.2" />
            <rect x="65" y="126" width="30" height="4.5" rx="2.25" fill="var(--success)" opacity="0.12" />
            <rect x="72" y="136" width="16" height="4.5" rx="2.25" fill="var(--success)" opacity="0.07" />
        </svg>
    );
}
