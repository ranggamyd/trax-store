import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { CopyButton } from "@/components/CopyButton";

export function DetailHeader({ title, subtitle, initialsText, imageUrl, avatarShape = "square", rightContent }) {
    const router = useRouter();
    const shapeClass = avatarShape === "circle" ? "rounded-full" : "rounded-xl";

    return (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md md:flex-row md:items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="shrink-0 rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                {imageUrl ? <div className={`h-16 w-16 shrink-0 border border-zinc-700/50 bg-zinc-800 bg-cover bg-center shadow-lg ${shapeClass}`} style={{ backgroundImage: `url(${imageUrl})` }} /> : <div className={`flex h-16 w-16 shrink-0 items-center justify-center border border-zinc-700/50 bg-zinc-800/80 text-2xl font-bold text-zinc-400 shadow-inner ${shapeClass}`}>{getInitials(initialsText || title || "A")}</div>}
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-widest text-white uppercase">
                        {title} <CopyButton textToCopy={title} className="h-6 w-6" />
                    </h1>
                    {typeof subtitle === "string" ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : <div className="mt-1">{subtitle}</div>}
                </div>
            </div>

            {rightContent && <div className="flex items-center gap-2 self-end md:self-center">{rightContent}</div>}
        </div>
    );
}
