/**
 * Header keamanan buat dashboard internal.
 * Semuanya dipasang di level response, jadi berlaku juga buat Server Action
 * dan route handler — bukan cuma halaman.
 */
const securityHeaders = [
    // Dashboard internal gak boleh nongol di hasil pencarian. Sama sekali.
    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    // Anti clickjacking: gak boleh di-embed di iframe mana pun.
    { key: "X-Frame-Options", value: "DENY" },
    // Browser jangan nebak-nebak MIME type.
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Jangan bocorin URL internal (yang sering bawa ID) ke situs luar.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Matiin API perangkat yang gak dipakai app ini.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Isolasi cross-origin dasar.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Jangan ngiklanin versi framework ke calon penyerang.
    poweredByHeader: false,

    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
