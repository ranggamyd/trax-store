import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
