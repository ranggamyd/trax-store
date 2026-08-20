import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { wibDateString, wibParts } from "@/lib/wib";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function getInitials(name) {
    if (!name) return "";
    const words = name
        .trim()
        .split(" ")
        .filter((w) => w.length > 0);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return "";
}

export function formatDuration(startedAt, endedAt) {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diff = Math.max(0, end - start);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDurationText(startedAt, endedAt) {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    let diff = Math.max(0, end - start);

    const msPerSecond = 1000;
    const msPerMinute = msPerSecond * 60;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerWeek = msPerDay * 7;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const years = Math.floor(diff / msPerYear);
    diff -= years * msPerYear;

    const months = Math.floor(diff / msPerMonth);
    diff -= months * msPerMonth;

    const weeks = Math.floor(diff / msPerWeek);
    diff -= weeks * msPerWeek;

    const days = Math.floor(diff / msPerDay);
    diff -= days * msPerDay;

    const hours = Math.floor(diff / msPerHour);
    diff -= hours * msPerHour;

    const minutes = Math.floor(diff / msPerMinute);
    diff -= minutes * msPerMinute;

    const seconds = Math.floor(diff / msPerSecond);

    const parts = [];
    if (years > 0) parts.push(`${years} tahun`);
    if (months > 0) parts.push(`${months} bulan`);
    if (weeks > 0) parts.push(`${weeks} minggu`);
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} detik`);

    return parts.join(" ");
}

export function getDefaultDateRange() {
    // Sabtu s/d Jumat menurut WIB, biar konsisten sama boundary di server action
    const nowWib = wibParts();
    const daysSinceSaturday = (nowWib.dayOfWeek + 1) % 7;

    return {
        startDate: wibDateString(nowWib, -daysSinceSaturday),
        endDate: wibDateString(nowWib, -daysSinceSaturday + 6),
    };
}
