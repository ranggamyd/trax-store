import { NextResponse } from "next/server";

import { setEldoradoToken } from "@/app/actions";
import { getCurrentAdmin } from "@/lib/auth";

/**
 * Nerima token Eldorado dari extension buat disimpen ke cookie httpOnly.
 *
 * Endpoint ini CUMA dipanggil same-origin dari hooks/useTokenRecovery.js.
 * Extension-nya sendiri gak pernah nembak sini langsung — dia ngasih token lewat
 * window.postMessage ke content script, terus halamannya yang forward ke sini.
 *
 * Makanya header CORS `Access-Control-Allow-Origin: *` yang dulu ada di sini dicabut:
 * nol fungsi, tapi bikin website mana pun bisa maksa nulis cookie token ke browser
 * admin yang lagi login (cookie injection / session fixation).
 */
export async function POST(request) {
    try {
        if (!(await getCurrentAdmin())) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
        }

        // Lapis kedua anti-CSRF: cuma layani request yang beneran same-origin.
        //
        // Versi sebelumnya nulis `if (origin && origin !== ...)` — dan `&&` itu
        // lubangnya: request TANPA header Origin lolos begitu aja. Sekarang
        // Origin WAJIB ada dan wajib cocok.
        //
        // Ini aman buat pemanggil aslinya: hooks/useTokenRecovery.js nembak
        // lewat fetch() POST same-origin, dan browser SELALU ngirim Origin di
        // request POST. Yang gak ngirim Origin cuma curl dan sejenisnya —
        // dan itu justru yang mau ditolak.
        if (request.headers.get("origin") !== request.nextUrl.origin) {
            return NextResponse.json({ success: false, error: "FORBIDDEN_ORIGIN" }, { status: 403 });
        }

        // Sinyal ketiga kalau browsernya ngirim: Fetch Metadata. Gak semua
        // browser ngirim, jadi cuma ditolak kalau ADA dan isinya bukan
        // same-origin — bukan ditolak karena absen.
        const fetchSite = request.headers.get("sec-fetch-site");
        if (fetchSite && fetchSite !== "same-origin") {
            return NextResponse.json({ success: false, error: "FORBIDDEN_ORIGIN" }, { status: 403 });
        }

        const { token } = await request.json();
        if (typeof token !== "string" || !token.trim()) {
            return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 });
        }

        const result = await setEldoradoToken(token);
        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 401 });
        }

        return NextResponse.json({ success: true, message: "Token synced successfully" });
    } catch {
        // Jangan bocorin error.message ke klien — isinya bisa detail internal.
        return NextResponse.json({ success: false, error: "SYNC_FAILED" }, { status: 500 });
    }
}
