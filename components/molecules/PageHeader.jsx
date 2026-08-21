import { PageTitle } from "@/components/atoms/PageTitle";
import { cn } from "@/lib/utils";

/**
 * Header halaman.
 *
 * Sekarang glass beneran. Yang lama cuma `bg-zinc-900/50 backdrop-blur-md`,
 * dan itu belum cukup — tanpa highlight di tepi atas, panelnya kelihatan
 * seperti kotak abu-abu burem, bukan kaca. Utility `glass` di globals.css
 * naro empat lapisnya sekaligus (fill, border, highlight, shadow).
 *
 * API-nya sengaja gak diubah supaya 6 halaman yang manggil komponen ini gak
 * perlu disentuh. `eyebrow` tambahan dan opsional.
 */
export function PageHeader({ title, subtitle, eyebrow, icon: Icon, color = "primary", rightContent, className }) {
    return (
        <header className={cn("glass rounded-2xl p-5 md:p-6", "flex flex-col items-start justify-between gap-5 md:flex-row md:items-center", className)}>
            <div className="min-w-0">
                <PageTitle icon={Icon} color={color} eyebrow={eyebrow}>
                    {title}
                </PageTitle>
                {subtitle && <p className="text-muted-foreground mt-2 text-sm md:ml-[3.625rem]">{subtitle}</p>}
            </div>

            {rightContent && <div className="flex w-full items-center justify-start md:w-auto md:justify-end">{rightContent}</div>}
        </header>
    );
}
