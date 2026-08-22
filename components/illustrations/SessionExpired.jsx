/**
 * Ilustrasi buat sesi login yang udah abis.
 *
 * Ini benerin metafora yang salah. Cabang `isAuthError` di app/error.js dulu
 * pakai SignalLost — gambar yang sama kayak error koneksi. Padahal dua hal itu
 * beda total buat user:
 *
 *   SignalLost  -> "coba lagi, biasanya pulih sendiri"
 *   SessionExpired -> "gak akan pulih sendiri, lu harus login"
 *
 * Gambar yang sama bikin user ngeklik "coba lagi" berkali-kali buat masalah yang
 * mustahil beres dengan cara itu.
 *
 * Metaforanya kartu akses yang masa berlakunya lewat. Kartunya UTUH — gak retak,
 * gak ilang — cuma udah gak laku. Itu persis kejadiannya: kredensialnya masih
 * ada di browser, cuma udah kedaluwarsa.
 *
 * Warnanya warning, bukan danger. Sesi abis itu kejadian normal, bukan
 * kegagalan sistem.
 *
 * DIEM TOTAL — layar error bukan tempat pamer gerakan, dan ini keadaan final
 * yang gak berubah sampai user ngapa-ngapain.
 */
export function SessionExpired({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="sessionExpiredGlow" cx="80" cy="78" r="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--warning)" stopOpacity="0.14" />
                    <stop offset="1" stopColor="var(--warning)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="78" r="56" fill="url(#sessionExpiredGlow)" />

            {/* Kartu akses, dimiringin dikit. Miring bikin dia kebaca sebagai
                benda yang dipegang, bukan ikon yang dipatok di grid. */}
            <g transform="rotate(-8 80 78)">
                <rect x="34" y="48" width="92" height="60" rx="10" fill="var(--surface-3)" />
                <rect x="34" y="48" width="92" height="60" rx="10" stroke="var(--border)" strokeWidth="1.6" />

                {/* Pita atas — bidang berwarna yang biasa ada di kartu akses */}
                <path d="M34 58a10 10 0 0 1 10-10h72a10 10 0 0 1 10 10v6H34z" fill="var(--warning)" fillOpacity="0.16" />

                {/* Chip. Garisnya putus-putus: kontaknya masih ada, otorisasinya
                    yang udah gak jalan. */}
                <rect x="46" y="74" width="22" height="18" rx="4" stroke="var(--warning)" strokeWidth="1.6" strokeDasharray="4 3.5" />
                <path d="M46 83h22M57 74v18" stroke="var(--warning)" strokeWidth="1" opacity="0.4" />

                {/* Dua baris data yang udah pudar */}
                <rect x="76" y="76" width="40" height="4" rx="2" fill="var(--foreground)" opacity="0.12" />
                <rect x="76" y="85" width="26" height="4" rx="2" fill="var(--foreground)" opacity="0.07" />
            </g>

            {/* Badge jam di pojok kanan bawah, jarumnya udah lewat batas.
                Ditaruh di luar rotasi kartu supaya tetep tegak — badge miring
                kebaca kayak bagian dari kartunya. */}
            <circle cx="118" cy="114" r="17" fill="var(--surface-1)" />
            <circle cx="118" cy="114" r="17" stroke="var(--warning)" strokeWidth="1.6" />
            <path d="M118 105v9l6.5 4" stroke="var(--warning)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Tiga garis waktu yang makin pendek — hitungan yang udah abis */}
            <path d="M28 124h20M34 132h14M40 140h8" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </svg>
    );
}
