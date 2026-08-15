import { cn } from "@/lib/utils";

export function PageContainer({ children, className }) {
    return (
        <div className={cn("text-foreground min-h-screen bg-black p-4 pb-20 md:p-8", className)}>
            <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">{children}</div>
        </div>
    );
}
