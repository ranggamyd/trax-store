"use server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { wibDayEnd, wibDayStart, wibMidnight, wibParts } from "@/lib/wib";

// Helper buat ngambil mapping user_id -> username
// Biar ga pusing urusan Foreign Key / Schema Cache di Supabase
async function getUsernameMap() {
    const { data } = await supabaseAdmin.from("admin_profiles").select("id, username");
    const map = {};
    if (data) {
        data.forEach((p) => {
            map[p.id] = p.username;
        });
    }
    return map;
}

// Helper buat pembulatan ke jam terdekat (toleransi 30 menit)
function roundToNearestHour(date) {
    const d = new Date(date);
    if (d.getMinutes() >= 30) {
        d.setHours(d.getHours() + 1);
    }
    d.setMinutes(0, 0, 0);
    return d;
}

/**
 * Get all currently active shifts (ended_at IS NULL).
 */
export async function getActiveShift() {
    const { data: shift, error } = await supabaseAdmin.from("shifts").select("*").is("ended_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();

    if (error) return { error: error.message };
    if (!shift) return { shift: null };

    const userMap = await getUsernameMap();
    shift.admin_profiles = { username: userMap[shift.user_id] || "Unknown" };

    return { shift };
}

/**
 * Get all users from admin_profiles (for dropdown select).
 */
export async function getShiftUsers() {
    const { data, error } = await supabaseAdmin.from("admin_profiles").select("id, username").order("username");

    if (error) return { error: error.message };
    return { users: data || [] };
}

/**
 * Start a new shift for a user.
 */
export async function startShift(userId, notes = "") {
    const { data: activeShift } = await supabaseAdmin.from("shifts").select("id, user_id").is("ended_at", null).maybeSingle();

    if (activeShift) {
        const userMap = await getUsernameMap();
        const username = userMap[activeShift.user_id] || "Someone";
        return { error: `Waduh, ${username} masih jaga nih! Akhirin dulu atau takeover.` };
    }

    const { data: shift, error } = await supabaseAdmin
        .from("shifts")
        .insert({
            user_id: userId,
            started_at: new Date().toISOString(),
            notes: notes || null,
        })
        .select("*")
        .single();

    if (error) return { error: error.message };

    const userMap = await getUsernameMap();
    shift.admin_profiles = { username: userMap[shift.user_id] || "Unknown" };

    return { shift };
}

/**
 * End the current active shift (self-ended).
 */
export async function endShift(shiftId) {
    const { data: shift, error } = await supabaseAdmin
        .from("shifts")
        .update({
            ended_at: new Date().toISOString(),
            ended_by: "self",
        })
        .eq("id", shiftId)
        .select("*")
        .single();

    if (error) return { error: error.message };

    const userMap = await getUsernameMap();
    shift.admin_profiles = { username: userMap[shift.user_id] || "Unknown" };

    return { shift };
}

/**
 * Takeover: End the current shift and start a new one for a different user.
 */
export async function takeoverShift(currentShiftId, newUserId) {
    const { data: endedShift, error: endError } = await supabaseAdmin
        .from("shifts")
        .update({
            ended_at: new Date().toISOString(),
            ended_by: "takeover",
        })
        .eq("id", currentShiftId)
        .select()
        .single();

    if (endError) return { error: endError.message };

    const { data: newShift, error: startError } = await supabaseAdmin
        .from("shifts")
        .insert({
            user_id: newUserId,
            started_at: new Date().toISOString(),
            takeover_from: currentShiftId,
        })
        .select("*")
        .single();

    if (startError) return { error: startError.message };

    const userMap = await getUsernameMap();
    newShift.admin_profiles = { username: userMap[newShift.user_id] || "Unknown" };

    return { endedShift, newShift };
}

/**
 * Get shift history with filters.
 */
export async function getShiftHistory({ startDate, endDate, userId, page = 0, pageSize = 20 } = {}) {
    let query = supabaseAdmin.from("shifts").select("*", { count: "exact" }).not("ended_at", "is", null).order("started_at", { ascending: false });

    if (startDate) {
        query = query.gte("started_at", wibDayStart(startDate));
    }
    if (endDate) {
        query = query.lte("started_at", wibDayEnd(endDate));
    }
    if (userId) {
        query = query.eq("user_id", userId);
    }

    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, error, count } = await query;

    if (error) return { error: error.message };

    const userMap = await getUsernameMap();
    const mappedShifts = (data || []).map((shift) => ({
        ...shift,
        admin_profiles: { username: userMap[shift.user_id] || "Unknown" },
    }));

    return { shifts: mappedShifts, total: count || 0 };
}

/**
 * Get summary of total hours per user (for payroll).
 */
export async function getShiftSummary({ startDate, endDate } = {}) {
    let query = supabaseAdmin.from("shifts").select("user_id, started_at, ended_at").not("ended_at", "is", null).order("started_at", { ascending: false });

    if (startDate) {
        query = query.gte("started_at", wibDayStart(startDate));
    }
    if (endDate) {
        query = query.lte("started_at", wibDayEnd(endDate));
    }

    const { data, error } = await query;
    if (error) return { error: error.message };

    const userMap = await getUsernameMap();
    const summaryMap = {};

    for (const shift of data || []) {
        const uid = shift.user_id;
        const username = userMap[uid] || "Unknown";

        const start = roundToNearestHour(shift.started_at);
        const end = roundToNearestHour(shift.ended_at);

        const minutes = (end - start) / 1000 / 60;

        if (!summaryMap[uid]) {
            summaryMap[uid] = { user_id: uid, username, total_minutes: 0, shift_count: 0 };
        }
        summaryMap[uid].total_minutes += minutes;
        summaryMap[uid].shift_count += 1;
    }

    return { summary: Object.values(summaryMap).sort((a, b) => b.total_minutes - a.total_minutes) };
}

/**
 * Get weekly summary of hours per user with clamping.
 * weekOffset: 0 for current week, -1 for last week, etc.
 * Week starts on Saturday 00:00:00 and ends on Friday 23:59:59.
 */
export async function getWeeklyShiftSummary({ weekOffset = 0 } = {}) {
    const nowWib = wibParts();
    const daysSinceSaturday = (nowWib.dayOfWeek + 1) % 7;
    const offsetDays = weekOffset * 7 - daysSinceSaturday;

    const startBoundary = wibMidnight(nowWib, offsetDays);
    const endBoundary = wibMidnight(nowWib, offsetDays + 7);

    const { data, error } = await supabaseAdmin.from("shifts").select("user_id, started_at, ended_at").lt("started_at", endBoundary.toISOString()).or(`ended_at.gt.${startBoundary.toISOString()},ended_at.is.null`);

    if (error) return { error: error.message };

    const userMap = await getUsernameMap();
    const summaryMap = {};

    for (const shift of data || []) {
        const uid = shift.user_id;
        const username = userMap[uid] || "Unknown";

        let start = roundToNearestHour(shift.started_at);
        let end = shift.ended_at ? roundToNearestHour(shift.ended_at) : roundToNearestHour(new Date());

        if (start < startBoundary) start = startBoundary;
        if (end > endBoundary) end = endBoundary;

        const minutes = (end - start) / 1000 / 60;

        if (minutes > 0) {
            if (!summaryMap[uid]) {
                summaryMap[uid] = { user_id: uid, username, total_minutes: 0, shift_count: 0 };
            }
            summaryMap[uid].total_minutes += minutes;
            summaryMap[uid].shift_count += 1;
        }
    }

    return {
        summary: Object.values(summaryMap).sort((a, b) => b.total_minutes - a.total_minutes),
        periodStart: startBoundary.toISOString(),
        periodEnd: new Date(endBoundary.getTime() - 1).toISOString(), // Friday 23:59:59
    };
}
