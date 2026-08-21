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

export const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mo`;
};

export const CANCEL_REASONS = [
    {
        value: "Buyer_Provided_Incorrect_Information",
        label: "Buyer has provided incorrect account information",
    },
    { value: "Out_Of_Stock", label: "Out of stock" },
    { value: "Buyer_Does_Not_Meet_Criteria", label: "Buyer does not meet criteria for the order" },
    { value: "Buyer_Unresponsive", label: "Buyer is unresponsive" },
    { value: "Buyer_Does_Not_Need_It_Anymore", label: "Buyer does not need it anymore" },
    { value: "Mutual_Agreement", label: "Mutual agreement" },
    { value: "Other", label: "Other" },
];
