import { ActivityIcon, AlertTriangleIcon, CheckCircleIcon, DollarSign, PackageIcon, XCircleIcon } from "lucide-react";

export const formatJsonValue = (data) => {
    if (!data) return "-";
    try {
        if (Array.isArray(data)) {
            if (data.length === 0) return "-";
            return data
                .map((item) => {
                    if (item.type && item.value) return `${item.type}: ${item.value}`;
                    if (item.name && item.value) return `${item.name}: ${item.value}`;
                    return typeof item === "object" ? JSON.stringify(item) : String(item);
                })
                .join(" | ");
        }
        if (typeof data === "object") {
            const entries = Object.entries(data);
            if (entries.length === 0) return "-";
            return entries.map(([k, v]) => `${k}: ${v}`).join(" | ");
        }
        return String(data);
    } catch {
        return "-";
    }
};

export const formatDeliveryTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
        let t = timeStr;
        let days = 0,
            hours = 0,
            minutes = 0,
            seconds = 0;

        if (t.includes(".")) {
            const parts = t.split(".");
            if (parts.length === 2 && parts[1].includes(":")) {
                days = parseInt(parts[0]);
                t = parts[1];
            }
        }

        const timeParts = t.split(":");
        if (timeParts.length === 3) {
            hours = parseInt(timeParts[0]);
            minutes = parseInt(timeParts[1]);
            seconds = parseInt(timeParts[2]);
        } else if (timeParts.length === 2) {
            minutes = parseInt(timeParts[0]);
            seconds = parseInt(timeParts[1]);
        } else {
            return timeStr;
        }

        if (days > 0) hours += days * 24;

        const parts = [];
        if (hours > 0) parts.push(`${hours} jam`);
        if (minutes > 0) parts.push(`${minutes} menit`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds} detik`);

        return parts.join(" ");
    } catch {
        return timeStr;
    }
};

export const getStatusIcon = (status, className) => {
    switch (status) {
        case "Completed":
            return <CheckCircleIcon className={className} />;
        case "Delivered":
            return <PackageIcon className={className} />;
        case "Paid":
            return <DollarSign className={className} />;
        case "Disputed":
            return <AlertTriangleIcon className={className} />;
        case "Canceled":
            return <XCircleIcon className={className} />;
        default:
            return <ActivityIcon className={className} />;
    }
};

/**
 * Waktu relatif, versi PENDEK — dipakai di badge kecil di daftar chat, jadi
 * gak boleh panjang.
 *
 * Versi lama balikin bahasa Inggris ("just now", "5m", "3h", "2mo") — nyempil
 * di UI yang seluruhnya bahasa Indonesia. Ini tempat kedua yang begitu; yang
 * pertama di halaman notifikasi, dan itu udah dibenerin pakai
 * `formatRelativeTimeId` di lib/utils.js.
 *
 * Yang ini SENGAJA gak pakai helper itu: helper-nya ngeluarin "5 menit lalu"
 * yang kepanjangan buat badge selebar 40px. Di sini yang dibutuhin bentuk
 * singkat, jadi formatnya beda tapi bahasanya sama.
 */
export const timeAgo = (timestamp) => {
    if (!timestamp) return "";

    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "baru";
    if (minutes < 60) return `${minutes} mnt`;
    if (hours < 24) return `${hours} jam`;
    if (days < 30) return `${days} hr`;
    return `${Math.floor(days / 30)} bln`;
};

export const CANCEL_REASONS = [
    {
        value: "Buyer_Provided_Incorrect_Information",
        label: "Info akun dari buyer salah",
    },
    { value: "Out_Of_Stock", label: "Stok habis" },
    { value: "Buyer_Does_Not_Meet_Criteria", label: "Buyer gak masuk kriteria order" },
    { value: "Buyer_Unresponsive", label: "Buyer gak bales chat" },
    { value: "Buyer_Does_Not_Need_It_Anymore", label: "Buyer udah gak butuh" },
    { value: "Mutual_Agreement", label: "Sepakat dua-duanya" },
    { value: "Other", label: "Alasan lain" },
];
