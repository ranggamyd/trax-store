import { TraxMark } from "@/components/illustrations/TraxMark";
import { cn } from "@/lib/utils";

/**
 * Kerangka halaman login & reset-password.
 *
 * Dibikin karena dua halaman itu tadinya nyalin layout yang sama: wrapper
 * `bg-black`, dua blob blur sebagai aurora, kartu berkaca, logo, judul.
 * Dua salinan artinya dua tempat yang harus diinget tiap kali ada perubahan.
 *
 * Blob aurora-nya DICABUT, bukan dipindah ke sini — AmbientBackground di root
 * layout udah nyediain aurora buat SEMUA halaman, termasuk halaman auth.
 * Yang lama itu efek yang sama digambar dua kali, dan yang di halaman malah
 * ketutupan `bg-black`-nya sendiri.
 */
export function AuthShell({ title, description, children, footer, className }) {
    return (
        <main className="flex min-h-[calc(100vh-2rem)] w-full items-center justify-center px-4 py-12">
            <div className={cn("glass w-full max-w-md rounded-3xl p-7 md:p-8", className)}>
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
