const isProduction = process.env.NODE_ENV === "production";

/**
 * Host Supabase, buat connect-src di CSP.
 *
 * Diambil dari env yang sama yang dipakai aplikasi, jadi kalau lu pindah
 * project Supabase, CSP-nya ikut tanpa perlu diedit manual.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHost = supabaseUrl.replace(/^https?:\/\//, "");

/**
 * Content Security Policy.
 *
 * DIPASANG SEBAGAI REPORT-ONLY DULU — lihat catatan di bawah `securityHeaders`.
 *
 * Daftar host di bawah ini bukan tebakan; semuanya diambil dari yang beneran
 * dipakai app ini:
 *   - cdn/api/*.talkjs.com          -> live chat di /orders (@talkjs/react)
 *   - assetsdelivery.eldorado.gg    -> ikon game di /games & /templates
 *   - fileserviceusprod.blob...     -> gambar offer dari Eldorado
 *   - images.unsplash.com           -> gambar placeholder
 *   - <supabase host>               -> REST + realtime (wss)
 *
 * Yang SENGAJA gak ada di sini: cognito-idp.us-east-2.amazonaws.com dan
 * www.eldorado.gg. Dua itu cuma di-fetch dari SERVER (refresh token & proxy
 * API), dan CSP cuma berlaku di browser.
 */
const contentSecurityPolicy = [
    "default-src 'self'",

    // 'unsafe-inline' masih perlu: Next nyisipin script inline buat payload RSC
    // dan hydration. Ngilangin ini butuh nonce per-request yang di-inject dari
    // proxy.js — bisa, tapi itu perubahan tersendiri, bukan tempelan di sini.
    "script-src 'self' 'unsafe-inline' https://cdn.talkjs.com",

    // Tailwind + komponen kita nulis style inline (mis. boxShadow token).
    "style-src 'self' 'unsafe-inline'",

    // next/font nge-host font-nya sendiri waktu build, jadi gak perlu gstatic.
    "font-src 'self' data:",

    "img-src 'self' data: blob: https://assetsdelivery.eldorado.gg https://fileserviceusprod.blob.core.windows.net https://images.unsplash.com https://*.talkjs.com",

    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.talkjs.com wss://*.talkjs.com`,

    // Chatbox TalkJS dirender di dalam iframe.
    "frame-src https://*.talkjs.com",

    // Lebih kuat dari X-Frame-Options, dan dipahami browser modern.
    "frame-ancestors 'none'",

    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
]
    .join("; ")
    .concat(isProduction ? "; upgrade-insecure-requests" : "");

/**
 * Header keamanan buat dashboard internal.
 * Berlaku di level response, jadi kena juga ke Server Action dan route handler.
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
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    // Isolasi cross-origin dasar.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

    /**
     * CSP DIPASANG REPORT-ONLY DULU. INI DISENGAJA.
     *
     * CSP yang kelewat ketat bikin halaman blank total, dan kegagalannya
     * kelihatan seperti app-nya rusak — bukan seperti header yang kurang satu
     * host. Report-only nge-report pelanggaran ke console browser TANPA
     * ngeblokir apa pun, jadi gak ada risiko.
     *
     * CARA NGAKTIFINNYA:
     *   1. Deploy / jalanin dev, buka SEMUA halaman — terutama /orders (TalkJS
     *      chat), /games (ikon), /offers (gambar).
     *   2. Buka DevTools Console, cari peringatan
     *      "Content Security Policy ... would be blocked".
     *   3. Kalau ada host yang kurang, tambahin ke daftar di atas.
     *   4. Kalau console-nya bersih, ganti key di bawah jadi
     *      "Content-Security-Policy" (buang "-Report-Only").
     *
     * Jangan langsung diaktifin tanpa langkah 1-3. TalkJS itu pihak ketiga
     * yang bisa nambah subdomain tanpa ngasih tau.
     */
    { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

/**
 * HSTS: paksa HTTPS selamanya, termasuk buat subdomain.
 *
 * SENGAJA cuma di production. Di localhost header ini bikin browser maksa
 * https://localhost:3000 — yang gak ada server-nya — dan efeknya NEMPEL di
 * browser lu sampai cache HSTS dibersihin manual. Itu pagi hari yang rusak
 * cuma gara-gara satu header.
 *
 * `preload` sengaja gak dipasang: itu ngirim domain lu ke daftar bawaan
 * browser dan susah dicabut. Baru tambahin kalau lu udah yakin domainnya
 * permanen HTTPS.
 */
const productionOnlyHeaders = [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Jangan ngiklanin versi framework ke calon penyerang.
    poweredByHeader: false,

    async headers() {
        return [
            {
                source: "/:path*",
                headers: isProduction ? [...securityHeaders, ...productionOnlyHeaders] : securityHeaders,
            },
        ];
    },
};

export default nextConfig;
