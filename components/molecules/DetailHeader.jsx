import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

export function DetailHeader({ title, subtitle, initialsText, imageUrl, avatarShape = "square", rightContent }) {
    const router = useRouter();
    const shapeClass = avatarShape === "circle" ? "rounded-full" : "rounded-xl";

    return (
        <div className="border-border bg-surface-2/50 flex flex-col justify-between gap-4 rounded-2xl border p-6 backdrop-blur-md md:flex-row md:items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-surface-3 hover:text-foreground shrink-0 rounded-full transition-colors" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                {imageUrl ? <div className={`border-border/50 bg-surface-3 h-16 w-16 shrink-0 border bg-cover bg-center shadow-lg ${shapeClass}`} style={{ backgroundImage: `url(${imageUrl})` }} /> : <div className={`border-border/50 bg-surface-3/80 text-muted-foreground flex h-16 w-16 shrink-0 items-center justify-center border text-2xl font-bold shadow-inner ${shapeClass}`}>{getInitials(initialsText || title || "A")}</div>}
                <div>
                    <h1 className="text-foreground flex items-center gap-2 text-3xl font-bold tracking-widest uppercase">
                        {title} <CopyButton textToCopy={title} className="h-6 w-6" />
                    </h1>
                    {typeof subtitle === "string" ? <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p> : <div className="mt-1">{subtitle}</div>}
                </div>
            </div>

            {rightContent && <div className="flex items-center gap-2 self-end md:self-center">{rightContent}</div>}
        </div>
    );
}
