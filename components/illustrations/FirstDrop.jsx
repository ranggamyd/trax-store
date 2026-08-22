/**
 * Ilustrasi empty state: SLOT yang masih kosong dan nunggu diisi.
 *
 * Ini gantiin EmptyRadar di kasus yang selama ini ketuker. Bedanya penting:
 *
 *   - EmptyRadar bilang "GUE UDAH NYARI dan gak nemu". Itu jawaban yang bener
 *     buat hasil pencarian kosong — user ngasih kata kunci, sistem nyari,
 *     hasilnya nol.
 *
 *   - FirstDrop bilang "BELUM ADA yang pertama, taruh di sini". Itu jawaban
 *     buat tabel yang beneran masih kosong dari awal.
 *
 * Sebelum ini dua keadaan itu dapet gambar yang sama, dan radar di halaman
 * kosong pertama kali ngirim pesan salah: kelihatan kayak sistemnya nyari data
 * yang seharusnya ada tapi ilang.
 *
 * Bentuknya slot dashed yang ngambang di atas plat perspektif — kotak putus-putus
 * itu konvensi yang udah kebaca di mana-mana sebagai "tempat yang disiapin",
 * bukan "tempat yang rusak".
 */
export function FirstDrop({ className, ...props }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <radialGradient id="firstDropGlow" cx="80" cy="74" r="60" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary)" stopOpacity="0.16" />
                    <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="firstDropEdge" x1="52" y1="42" x2="108" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--brand-from)" />
                    <stop offset="1" stopColor="var(--brand-to)" />
                </linearGradient>
            </defs>

            <circle cx="80" cy="74" r="60" fill="url(#firstDropGlow)" />

            {/* Plat dasar dalam perspektif. Dua elips bikin kesan bidang yang
                surut ke belakang tanpa perlu gambar kotak 3D. */}
            <ellipse cx="80" cy="126" rx="46" ry="11.5" stroke="var(--border)" strokeWidth="1" />
            <ellipse cx="80" cy="126" rx="27" ry="6.5" stroke="var(--border)" strokeWidth="1" opacity="0.55" />

            {/* Garis jatuh dari slot ke plat — nyambungin dua elemen biar slotnya
                kebaca ngambang DI ATAS plat, bukan cuma nempel sembarangan. */}
            <path d="M56 102v14M104 102v14" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />

            {/* Slot kosongnya */}
            <g style={{ animation: "float-soft 4.5s ease-in-out infinite" }}>
                <rect x="52" y="44" width="56" height="56" rx="15" fill="var(--primary)" fillOpacity="0.05" />
                <rect x="52" y="44" width="56" height="56" rx="15" stroke="url(#firstDropEdge)" strokeWidth="2" strokeDasharray="11 9" strokeLinecap="round" />
                <path d="M80 63v18M71 72h18" stroke="url(#firstDropEdge)" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Dua slot bayangan di belakang — nandain "bakal ada banyak", jadi
                yang pertama gak kelihatan kayak satu-satunya yang boleh masuk. */}
            <rect x="34" y="58" width="14" height="28" rx="6" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
            <rect x="112" y="58" width="14" height="28" rx="6" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
        </svg>
    );
}
