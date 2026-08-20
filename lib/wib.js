// Semua boundary tanggal di app ini dihitung pake WIB (Asia/Jakarta, UTC+7, no DST),
// BUKAN timezone proses Node. Kalau pake new Date(y, m, d) biasa, hasilnya beda antara
// laptop (Asia/Jakarta) dan server deploy (UTC) — shift jam 00:30 WIB bisa keitung
// hari sebelumnya.

export const WIB_OFFSET = "+07:00";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Pecah sebuah instant jadi komponen kalender WIB. */
export function wibParts(date = new Date()) {
    const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth() + 1,
        day: shifted.getUTCDate(),
        dayOfWeek: shifted.getUTCDay(),
    };
}

/** Komponen kalender WIB (+ addDays) jadi "YYYY-MM-DD" buat <input type="date">. */
export function wibDateString({ year, month, day }, addDays = 0) {
    return new Date(Date.UTC(year, month - 1, day + addDays)).toISOString().slice(0, 10);
}

/** Tengah malam WIB pada tanggal tsb (+ addDays), sebagai instant absolut. */
export function wibMidnight({ year, month, day }, addDays = 0) {
    return new Date(Date.UTC(year, month - 1, day + addDays) - WIB_OFFSET_MS);
}

/** Awal hari WIB dari "YYYY-MM-DD", siap dikirim ke Postgres sebagai timestamptz. */
export function wibDayStart(dateString) {
    return `${dateString}T00:00:00.000${WIB_OFFSET}`;
}

/** Akhir hari WIB dari "YYYY-MM-DD", siap dikirim ke Postgres sebagai timestamptz. */
export function wibDayEnd(dateString) {
    return `${dateString}T23:59:59.999${WIB_OFFSET}`;
}
