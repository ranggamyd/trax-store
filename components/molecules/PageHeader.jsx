import { NeonTitle } from "@/components/atoms/NeonTitle";

export function PageHeader({ title, subtitle, icon: Icon, color = "primary", rightContent, className }) {
    return (
        <div className={`flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md md:flex-row md:items-center ${className || ""}`}>
            <div>
                <NeonTitle color={color} icon={Icon}>
                    {title}
                </NeonTitle>
                {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
            </div>
            {rightContent && <div className="flex w-full items-center justify-end md:w-auto">{rightContent}</div>}
        </div>
    );
}
