/**
 * Ilustrasi buat "belum ada yang jaga".
 *
 * Gantiin ikon `Clock` dari lucide yang ditaruh di dalem bulatan abu-abu.
 * Masalah ikon itu bukan jeleknya — masalahnya dia ngomongin WAKTU, padahal
 * yang kosong itu ORANGNYA. Slot avatar yang masih bolong ngomong langsung ke
 * intinya: kursinya ada, yang duduk belum.
 *
 * Warnanya warning, bukan danger. Gak ada yang jaga itu perlu diberesin, tapi
 * bukan kerusakan — merah di sini bikin panik buat keadaan yang normal kejadian
 * tiap ganti shift.
 *
 * Cincinnya napas pelan (4s) — nunjukin posisinya masih nunggu, bukan mati.
 */
export function Standby({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="standbyGlow" cx="80" cy="76" r="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--warning)" stopOpacity="0.13" />
                    <stop offset="1" stopColor="var(--warning)" stopOpacity="0" />
                </radialGradient>
            </defs>

            <circle cx="80" cy="76" r="56" fill="url(#standbyGlow)" />

            {/* Cincin luar solid — bingkai posisinya, yang ini SELALU ada */}
            <circle cx="80" cy="76" r="46" stroke="var(--border)" strokeWidth="1" />

            {/* Slot avatar yang bolong. Dashed + napas pelan = "nunggu diisi" */}
            <circle cx="80" cy="76" r="34" stroke="var(--warning)" strokeWidth="2" strokeDasharray="8 10" strokeLinecap="round" style={{ animation: "breathe 4s ease-in-out infinite" }} />

            {/* Sosok orang, digambar tipis — hadir sebagai cetakan, bukan sebagai
                orang. Kalau digambar tegas, dia kebaca kayak "ada yang jaga". */}
            <circle cx="80" cy="66" r="9.5" stroke="var(--muted-foreground)" strokeWidth="1.8" opacity="0.45" />
            <path d="M63 94a17 17 0 0 1 34 0" stroke="var(--muted-foreground)" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />

            {/* Badge jam di pojok — jarumnya di jam 12 pas, posisi netral.
                Jam yang nunjuk waktu tertentu bikin orang mikir itu jadwal. */}
            <circle cx="116" cy="110" r="15" fill="var(--surface-3)" />
            <circle cx="116" cy="110" r="15" stroke="var(--border)" strokeWidth="1" />
            <path d="M116 102v8h6" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Indikator status: bulatan kosong, bukan bulatan nyala. Sebelahan
                sama titik hijau berdenyut yang muncul kalau ADA yang jaga —
                jadi dua keadaan itu kebaca beda dalam sekali lirik. */}
            <circle cx="44" cy="110" r="5" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.5" />
        </svg>
    );
}
