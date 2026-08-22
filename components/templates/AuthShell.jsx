import { Spotlight } from "@/components/aceternity/Spotlight";
import { TraxMark } from "@/components/illustrations/TraxMark";
import { cn } from "@/lib/utils";

/**
 * Kerangka halaman login & reset-password.
 *
 * Dibikin karena dua halaman itu tadinya nyalin layout yang sama: wrapper
 * `bg-black`, dua blob blur sebagai aurora, kartu berkaca, logo, judul.
 *
 * Blob aurora manualnya dicabut dan diganti <Spotlight> dari Aceternity —
 * sorotan miring yang masuk pelan dari kiri atas. Bedanya bukan cuma tampilan:
 * blob yang lama itu dua div blur yang justru ketutupan `bg-black`-nya sendiri,
 * jadi efeknya gak pernah kelihatan. Spotlight-nya SVG di lapisan terpisah.
 */
export function AuthShell({ title, description, children, footer, className }) {
    return (
        <main className="relative flex min-h-[calc(100vh-2rem)] w-full items-center justify-center overflow-hidden px-4 py-12">
            <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" />

            <div className={cn("glass relative z-10 w-full max-w-md rounded-3xl p-7 md:p-8", className)}>
                <div className="flex flex-col items-center text-center">
                    {/* Logo dalam tile berkaca — satu-satunya glow di layar ini,
                        jadi mata langsung mendarat di identitas produknya. */}
                    <div className="border-primary/25 bg-primary/10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border" style={{ boxShadow: "var(--glow-primary)" }}>
                        <TraxMark className="h-8 w-8" />
                    </div>

                    <h1 className="text-brand text-2xl font-bold tracking-tight">Traxstore</h1>

                    <p className="text-foreground mt-3 text-lg font-semibold tracking-tight">{title}</p>
                    {description && <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>}
                </div>

                <div className="mt-7">{children}</div>

                {footer && <div className="border-border/60 mt-6 border-t pt-5 text-center">{footer}</div>}
            </div>
        </main>
    );
}
