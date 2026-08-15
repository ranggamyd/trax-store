"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * A table row that navigates on click, ignoring clicks on buttons, links, dialogs, and switches.
 * Replaces 8+ duplicate onClick handler patterns.
 */
export function ClickableTableRow({ href, children, className, ...props }) {
    const router = useRouter();

    const handleClick = (e) => {
        const ignoredSelectors = ["button", "a", '[role="dialog"]', ".switch-no-nav"];
        const shouldIgnore = ignoredSelectors.some((sel) => e.target.closest(sel));
        if (!shouldIgnore && href) {
            router.push(href);
        }
    };

    return (
        <TableRow className={cn("cursor-pointer border-zinc-800 hover:bg-zinc-900/50", className)} onClick={handleClick} {...props}>
            {children}
        </TableRow>
    );
}
