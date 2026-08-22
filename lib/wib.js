export const WIB_OFFSET = "+07:00";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function wibParts(date = new Date()) {
    const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth() + 1,
        day: shifted.getUTCDate(),
        dayOfWeek: shifted.getUTCDay(),
    };
}

export function wibDateString({ year, month, day }, addDays = 0) {
    return new Date(Date.UTC(year, month - 1, day + addDays)).toISOString().slice(0, 10);
}

export function wibMidnight({ year, month, day }, addDays = 0) {
    return new Date(Date.UTC(year, month - 1, day + addDays) - WIB_OFFSET_MS);
}

export function wibDayStart(dateString) {
    return `${dateString}T00:00:00.000${WIB_OFFSET}`;
}

export function wibDayEnd(dateString) {
    return `${dateString}T23:59:59.999${WIB_OFFSET}`;
}

/**
 * Formatter tanggal/jam WIB.
 *
 * WAJIB dipakai buat apa pun yang dirender di SERVER.
 *
 * `toLocaleTimeString("id-ID")` tanpa timeZone ngikutin timezone MESIN yang
 * ngerender. Di browser admin itu kebetulan bener (WIB), tapi di server Vercel
 * itu UTC — jadi jam shift bakal kelihatan meleset 7 jam begitu komponennya
 * dipindah ke Server Component.
 *
 * Dipatok eksplisit ke Asia/Jakarta juga sekalian benerin kasus lain: admin
 * yang timezone laptopnya kesetel salah, atau yang sedang di luar negeri,
 * sebelumnya liat jam shift yang beda dari yang kecatat.
 */
export const WIB_TIMEZONE = "Asia/Jakarta";

export function formatWibTime(value) {
    if (!value) return "-";
    return new Date(value).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: WIB_TIMEZONE,
    });
}

export function formatWibDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: WIB_TIMEZONE,
    });
}

/**
 * Nama hari WIB — "Sabtu", atau "Sab" kalau short.
 *
 * Dipisah dari formatWibDate, bukan digabung ke dalamnya, karena empat tempat
 * lain yang pakai formatWibDate cuma butuh tanggalnya (created_at akun, rentang
 * periode mingguan). Nama hari di situ cuma nambah panjang tanpa nambah info.
 *
 * Di riwayat shift beda: rotasi jaganya jalan per hari (Sabtu–Jumat), jadi
 * "Sabtu" lebih cepat kebaca daripada nerjemahin "16 Agu 2026" di kepala.
 */
export function formatWibWeekday(value, { short = false } = {}) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
        weekday: short ? "short" : "long",
        timeZone: WIB_TIMEZONE,
    });
}
