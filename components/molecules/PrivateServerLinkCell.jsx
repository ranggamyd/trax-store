import { CopyButton } from "@/components/CopyButton";

/**
 * Renders a private server link with copy button, or "Gak ada link" placeholder.
 * Used in game detail (account tab) and account detail (game tab) — 3 duplicate instances.
 */
export function PrivateServerLinkCell({ link }) {
    if (link) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground max-w-[200px] truncate text-xs">{link}</span>
                <CopyButton textToCopy={link} className="h-6 w-6" />
            </div>
        );
    }

    return <span className="text-muted-foreground/70 text-xs italic">Gak ada link</span>;
}
