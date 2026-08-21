import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/** Route yang boleh diakses tanpa login. Sisanya dikunci. */
const PUBLIC_ROUTES = ["/login", "/reset-password"];

function isPublicRoute(pathname) {
    return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default async function proxy(request) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
        },
    });

    // getUser() sekalian nge-refresh token yang mau expired dan nulis cookie barunya
    // lewat setAll di atas. Ini alasan middleware harus selalu balikin `response`.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname, search } = request.nextUrl;
    const isPublic = isPublicRoute(pathname);

    // Belum login + halaman terproteksi -> tendang ke login, simpen tujuan awalnya.
    if (!user && !isPublic) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    // Udah login tapi masih nangkring di /login -> lempar ke dashboard.
    if (user && isPublic) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = "/";
        homeUrl.search = "";
        return NextResponse.redirect(homeUrl);
    }

    return response;
}

export const config = {
    matcher: [
        // Semua route KECUALI aset statis Next dan file gambar.
        // /api ikut kejaring dengan sengaja — route handler juga butuh dikunci.
        "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
    ],
};
