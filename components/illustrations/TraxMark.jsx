/**
 * Logo mark Traxstore.
 *
 * Gantiin ikon `Gamepad2` dari lucide yang dipakai sebagai logo sebelumnya —
 * ikon generik dari icon set itu ngasih sinyal "belum sempat bikin logo".
 *
 * Bentuknya: shard heksagonal (bidang, teknis, gampang dikenali di ukuran
 * favicon) dengan bilah "T" di dalem yang dipotong jadi bentuk bolt. Digambar
 * di grid 32x32 supaya tetep tajam di 16px — garis 1.5px jatuh persis di pixel.
 *
 * Catatan soal ID gradient: sengaja statis, bukan pakai useId(). Kalau mark ini
 * dirender beberapa kali di satu halaman, ID-nya bentrok — tapi karena semua
 * definisinya IDENTIK, hasil visualnya sama persis. Trade-off ini yang bikin
 * komponennya bisa tetep jadi Server Component (nol JS).
 */
export function TraxMark({ className, ...props }) {
    return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className} {...props}>
            <defs>
                <linearGradient id="traxMarkFill" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--brand-from)" />
                    <stop offset="1" stopColor="var(--brand-to)" />
                </linearGradient>
            </defs>

            {/* Shard: isian samar + garis gradient. Dua lapis ini yang bikin
                mark-nya kebaca baik di background terang maupun gelap. */}
            <path d="M16 2.4 27.4 8.9v14.2L16 29.6 4.6 23.1V8.9z" fill="url(#traxMarkFill)" opacity="0.16" />
            <path d="M16 2.4 27.4 8.9v14.2L16 29.6 4.6 23.1V8.9z" stroke="url(#traxMarkFill)" strokeWidth="1.6" strokeLinejoin="round" />

            {/* Bilah "T" yang batang bawahnya dimiringin jadi bolt */}
            <path d="M10.6 11.4h10.8" stroke="url(#traxMarkFill)" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M16.9 11.4 14.4 18h4.2l-3.9 6.4" stroke="url(#traxMarkFill)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
