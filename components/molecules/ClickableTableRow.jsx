"use client";

import { useRouter } from "next/navigation";

import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Baris tabel yang navigasi kalau diklik, tapi ngabaikan klik di tombol, link,
 * dialog, dan switch. Gantiin 8+ handler onClick duplikat.
 *
 * Yang diperbaiki selain warna:
 *
 * 1. Bisa diakses dari KEYBOARD. Sebelumnya cuma ada onClick di <tr> — jadi
 *    baris tabel ini mustahil dibuka pakai Tab + Enter. Sekarang ada
 *    tabIndex, role="link", dan handler Enter/Space.
 *
 * 2. Klik tengah / Ctrl+klik gak lagi ketelen. Dulu handler-nya selalu
 *    router.push, jadi kebiasaan "buka di tab baru" mati di tabel ini.
 *
 * 3. `[role="menu"]` masuk daftar abaikan — dropdown di dalam baris tadinya
 *    ikut men-trigger navigasi waktu itemnya dipilih.
 */
const IGNORED_SELECTORS = ["button", "a", "input", "label", '[role="dialog"]', '[role="menu"]', '[role="switch"]', ".switch-no-nav"];

export function ClickableTableRow({ href, children, className, ...props }) {
    const router = useRouter();

    const shouldIgnore = (target) => IGNORED_SELECTORS.some((sel) => target.closest?.(sel));

    const handleClick = (e) => {
        if (!href || shouldIgnore(e.target)) return;

        // Hormatin cara user biasa buka tab baru.
        if (e.metaKey || e.ctrlKey || e.button === 1) {
            window.open(href, "_blank", "noopener");
            return;
        }

        router.push(href);
    };

    const handleKeyDown = (e) => {
        if (!href || shouldIgnore(e.target)) return;
        if (e.key !== "Enter" && e.key !== " ") return;

        e.preventDefault();
        router.push(href);
    };

    return (
        <TableRow className={cn("border-border hover:bg-surface-2/70 focus-visible:bg-surface-2/70 transition-colors", href && "cursor-pointer", className)} onClick={handleClick} onKeyDown={handleKeyDown} tabIndex={href ? 0 : undefined} role={href ? "link" : undefined} {...props}>
            {children}
        </TableRow>
    );
}
