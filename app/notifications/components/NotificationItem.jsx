"use client";

import { AlertCircleIcon, BellIcon, CheckCircle2Icon, MessageSquareIcon, ShoppingCartIcon } from "lucide-react";

import { cn, formatRelativeTimeId } from "@/lib/utils";

/**
 * Satu baris notifikasi.
 *
 * Nama event Eldorado dipetain ke bahasa manusia di satu tempat. Versi lama
 * naro fungsi `getEventDisplayTitle` DI DALAM .map() — jadi fungsinya dibikin
 * ulang buat tiap baris, tiap render.
 */
const EVENT_META = {
    OrderCreated: { label: "Order baru masuk", icon: ShoppingCartIcon, tone: "text-success" },
    OrderPaid: { label: "Order dibayar", icon: ShoppingCartIcon, tone: "text-success" },
    OrderDelivered: { label: "Order dikirim", icon: CheckCircle2Icon, tone: "text-accent" },
    OrderCompleted: { label: "Order selesai", icon: CheckCircle2Icon, tone: "text-accent" },
    OrderCanceled: { label: "Order dibatalin", icon: AlertCircleIcon, tone: "text-danger" },
    OrderDisputed: { label: "Order disengketain", icon: AlertCircleIcon, tone: "text-danger" },
    MessageReceived: { label: "Pesan baru", icon: MessageSquareIcon, tone: "text-warning" },
};

const FALLBACK_META = { icon: BellIcon, tone: "text-primary" };

export function NotificationItem({ notif, onOpen, onMarkRead }) {
    const n = notif.notification;
    if (!n) return null;

    const meta = EVENT_META[n.event] ?? FALLBACK_META;
    const Icon = meta.icon;
    const label = EVENT_META[n.event]?.label ?? n.event ?? "Notifikasi";

    const isUnread = n.notificationReadStatus !== "IsRead";
    const price = n.details?.price?.amount;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(notif)}
            onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                onOpen(notif);
            }}
            // Glow-nya dicabut. Versi lama naro shadow glow di kartu, di bar kiri,
            // DAN di state hover — tiga glow per baris yang belum kebaca. Kalau
            // 20 notif belum kebaca, seluruh layar nyala dan gak ada yang menonjol.
            // Sekarang pembedanya cukup: bar kiri + latar tipis + teks lebih tegas.
            className={cn("group relative flex cursor-pointer gap-4 overflow-hidden rounded-xl border p-4 transition-colors", isUnread ? "border-primary/30 bg-primary/[0.05] hover:border-primary/50" : "border-border bg-surface-1/50 hover:bg-surface-2/70")}
        >
            {isUnread && <span className="bg-primary absolute top-0 bottom-0 left-0 w-1" />}

            <div className="shrink-0 pt-0.5">
                <div className={cn("flex items-center justify-center rounded-full p-2.5", isUnread ? "bg-surface-3/80" : "bg-surface-2")}>
                    <Icon className={cn("h-5 w-5", meta.tone)} />
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="mb-0.5 flex items-center gap-3">
                    <h3 className={cn("text-sm font-semibold", isUnread ? "text-foreground" : "text-muted-foreground")}>{label}</h3>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">{formatRelativeTimeId(n.notificationDate)}</span>
                </div>

                {n.details?.title && <p className={cn("text-[13px]", isUnread ? "text-foreground/85" : "text-muted-foreground")}>{n.details.title}</p>}

                {notif.customNotification?.text && <p className="text-muted-foreground line-clamp-2 text-[13px]">{notif.customNotification.text}</p>}

                {n.details?.buyerUsername && (
                    <p className="text-muted-foreground mt-1 text-[13px]">
                        Buyer: <span className={cn("font-semibold", isUnread ? "text-foreground" : "text-muted-foreground")}>{n.details.buyerUsername}</span>
                    </p>
                )}
            </div>

            <div className="flex min-w-[84px] shrink-0 flex-col items-end justify-between gap-2">
                {isUnread ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(n.id);
                        }}
                        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2 transition-colors"
                    >
                        Tandai dibaca
                    </button>
                ) : (
                    <span />
                )}

                {price > 0 && <span className="border-success/25 bg-success/12 text-success mt-auto rounded border px-1.5 py-0.5 text-xs font-semibold">${price.toFixed(2)}</span>}
            </div>
        </div>
    );
}
