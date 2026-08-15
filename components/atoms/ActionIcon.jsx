import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ActionIcon({ icon: Icon, onClick, variant = "default", title, className, disabled }) {
    const variants = {
        default: "text-zinc-400 hover:text-white hover:bg-zinc-800",
        edit: "text-zinc-500 hover:text-accent hover:bg-accent/10",
        delete: "text-zinc-500 hover:text-red-500 hover:bg-red-500/10",
        copy: "text-zinc-400 hover:text-white hover:bg-zinc-800",
        success: "text-zinc-500 hover:text-green-500 hover:bg-green-500/10",
        warning: "text-zinc-500 hover:text-yellow-500 hover:bg-yellow-500/10",
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 transition-colors", variants[variant], className)}
            title={title}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
            disabled={disabled}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}
