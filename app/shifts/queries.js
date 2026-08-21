import "server-only";

import { getCurrentAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDefaultDateRange } from "@/lib/utils";
import { wibDayEnd, wibDayStart, wibMidnight, wibParts } from "@/lib/wib";

/**
 * Baca data shift. DIPINDAH dari app/actions/shifts.js.
 *
 * Kenapa dipindah: di file "use server", tiap fungsi baca jadi endpoint HTTP
 * publik. Setelah dashboard & /shifts jadi Server Component, gak ada lagi kode
 * klien yang manggil fungsi-fungsi ini — jadi 4 endpoint itu murni permukaan
 * serangan tanpa pemakai. Di sini dia balik jadi fungsi biasa yang dipagerin
 * `server-only`.
 *
 * `getShiftSummary` (rekap payroll) sekalian DIHAPUS: dia diekspor sebagai
 * Server Action tapi gak dipanggil dari mana pun. Endpoint publik yang gak ada
 * pemakainya itu utang, bukan fitur.
 */

/**
 * Mapping user_id -> username.
 * Sengaja query terpisah, bukan join, biar gak bergantung ke schema cache
 * foreign key Supabase yang sering ketinggalan.
 */
export async function getUsernameMap() {
    const { data } = await supabaseAdmin.from("admin_profiles").select("id, username");

    const map = {};
    for (const profile of data ?? []) map[profile.id] = profile.username;
    return map;
}

/** Pembulatan ke jam terdekat, toleransi 30 menit. */
export function roundToNearestHour(date) {
    const d = new Date(date);
    if (d.getMinutes() >= 30) d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    return d;
}

/** Shift yang lagi jalan (ended_at masih null). */
export async function getActiveShiftData() {
    if (!(await getCurrentAdmin())) return { shift: null, error: null };

    const { data: shift, error } = await supabaseAdmin.from("shifts").select("*").is("ended_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();

    if (error) return { shift: null, error: error.message };
    if (!shift) return { shift: null, error: null };

    const userMap = await getUsernameMap();

    return {
        shift: { ...shift, username: userMap[shift.user_id] ?? "Unknown" },
        error: null,
    };
}

/** Daftar admin buat dropdown filter. */
export async function getShiftUsersList() {
    if (!(await getCurrentAdmin())) return [];

    const { data } = await supabaseAdmin.from("admin_profiles").select("id, username").order("username");
    return data ?? [];
}

/** Riwayat shift dengan filter + pagination. `page` 0-based. */
export async function getShiftHistoryPage({ startDate, endDate, userId, page = 0, pageSize = 20 } = {}) {
    if (!(await getCurrentAdmin())) return { shifts: [], total: 0, error: null };

    let request = supabaseAdmin.from("shifts").select("*", { count: "exact" }).not("ended_at", "is", null).order("started_at", { ascending: false });

    if (startDate) request = request.gte("started_at", wibDayStart(startDate));
    if (endDate) request = request.lte("started_at", wibDayEnd(endDate));
    if (userId) request = request.eq("user_id", userId);

    request = request.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, error, count } = await request;
    if (error) return { shifts: [], total: 0, error: error.message };

    const userMap = await getUsernameMap();

    return {
        shifts: (data ?? []).map((shift) => ({ ...shift, username: userMap[shift.user_id] ?? "Unknown" })),
        total: count ?? 0,
        error: null,
    };
}

/**
 * Rekap jam per admin dalam satu minggu.
 * Minggu-nya Sabtu 00:00 s/d Jumat 23:59 WIB. weekOffset 0 = minggu ini.
 */
export async function getWeeklySummary({ weekOffset = 0 } = {}) {
    if (!(await getCurrentAdmin())) return { summary: [], periodStart: null, periodEnd: null, error: null };

    const nowWib = wibParts();
    const daysSinceSaturday = (nowWib.dayOfWeek + 1) % 7;
    const offsetDays = weekOffset * 7 - daysSinceSaturday;

    const startBoundary = wibMidnight(nowWib, offsetDays);
    const endBoundary = wibMidnight(nowWib, offsetDays + 7);

    const { data, error } = await supabaseAdmin.from("shifts").select("user_id, started_at, ended_at").lt("started_at", endBoundary.toISOString()).or(`ended_at.gt.${startBoundary.toISOString()},ended_at.is.null`);

    if (error) return { summary: [], periodStart: null, periodEnd: null, error: error.message };

    const userMap = await getUsernameMap();
    const perUser = {};

    for (const shift of data ?? []) {
        let start = roundToNearestHour(shift.started_at);
        let end = shift.ended_at ? roundToNearestHour(shift.ended_at) : roundToNearestHour(new Date());

        // Shift yang nyeberang batas minggu dipotong di batasnya, biar jamnya
        // gak kehitung dobel di dua minggu.
        if (start < startBoundary) start = startBoundary;
        if (end > endBoundary) end = endBoundary;

        const minutes = (end - start) / 60000;
        if (minutes <= 0) continue;

        const uid = shift.user_id;
        perUser[uid] ??= { user_id: uid, username: userMap[uid] ?? "Unknown", total_minutes: 0, shift_count: 0 };
        perUser[uid].total_minutes += minutes;
        perUser[uid].shift_count += 1;
    }

    return {
        summary: Object.values(perUser).sort((a, b) => b.total_minutes - a.total_minutes),
        periodStart: startBoundary.toISOString(),
        periodEnd: new Date(endBoundary.getTime() - 1).toISOString(),
        error: null,
    };
}

export const SHIFT_HISTORY_PAGE_SIZE = 20;

/**
 * Satu loader buat SEMUA data yang dibutuhin tampilan shift.
 *
 * Dipakai bareng oleh dashboard (/) dan /shifts. Sebelumnya dua halaman itu
 * masing-masing nyusun tiga komponen yang fetch sendiri-sendiri — jadi buka
 * dashboard nembak 4 request berurutan dari browser. Sekarang semuanya jalan
 * PARALEL di server dalam satu request.
 *
 * Parsing searchParams-nya juga di sini, biar dua halaman gak beda-beda
 * nafsirin `?week=` atau `?page=`.
 */
export async function getShiftViewData(params = {}) {
    const defaults = getDefaultDateRange();

    const startDate = typeof params.from === "string" && params.from ? params.from : defaults.startDate;
    const endDate = typeof params.to === "string" && params.to ? params.to : defaults.endDate;
    const adminId = typeof params.admin === "string" ? params.admin : "";

    // weekOffset dibatesin <= 0: minggu depan belum ada shift-nya, jadi gak ada
    // gunanya dan cuma bikin user nemu layar kosong.
    const parsedWeek = Number.parseInt(params.week ?? "0", 10);
    const weekOffset = Number.isFinite(parsedWeek) ? Math.min(0, parsedWeek) : 0;

    const parsedPage = Number.parseInt(params.page ?? "1", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const [active, weekly, history, admins, currentAdmin] = await Promise.all([getActiveShiftData(), getWeeklySummary({ weekOffset }), getShiftHistoryPage({ startDate, endDate, userId: adminId || undefined, page: page - 1, pageSize: SHIFT_HISTORY_PAGE_SIZE }), getShiftUsersList(), getCurrentAdmin()]);

    return {
        activeShift: active.shift,
        activeShiftError: active.error,

        weekly,
        weekOffset,

        history: history.shifts,
        historyTotal: history.total,
        historyError: history.error,
        historyPage: page,
        historyPageCount: Math.max(1, Math.ceil(history.total / SHIFT_HISTORY_PAGE_SIZE)),
        historyPageSize: SHIFT_HISTORY_PAGE_SIZE,

        admins,
        currentAdminId: currentAdmin?.id ?? null,

        filters: { startDate, endDate, adminId },
        defaults,
    };
}
