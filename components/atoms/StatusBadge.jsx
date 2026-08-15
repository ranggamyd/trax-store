import { cn } from "@/lib/utils";

export function StatusBadge({ children, variant = "default", className }) {
    const variants = {
        default: "bg-zinc-800 text-zinc-300",
        success: "bg-green-500/20 text-green-400",
        danger: "bg-red-500/20 text-red-400",
        warning: "bg-yellow-500/20 text-yellow-400",
        info: "bg-blue-500/20 text-blue-400",
        primary: "bg-primary/20 text-primary",
        accent: "bg-accent/20 text-accent",
    };

    return <span className={cn("rounded-md px-2 py-1 text-xs font-bold tracking-wider uppercase", variants[variant], className)}>{children}</span>;
}
