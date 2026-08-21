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

        // Lapis kedua anti-CSRF: cuma layani request yang keliatan same-origin.
        // Form lintas-site gak bisa nyetel Origin, jadi ini nyaring drive-by POST.
        const origin = request.headers.get("origin");
        if (origin && origin !== request.nextUrl.origin) {
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
