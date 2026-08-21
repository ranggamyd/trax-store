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
