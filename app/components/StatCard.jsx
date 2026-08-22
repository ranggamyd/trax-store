import Link from "next/link";

import { CardSpotlight } from "@/components/aceternity/CardSpotlight";
import { NumberTicker } from "@/components/aceternity/NumberTicker";
import { cn } from "@/lib/utils";

const TONES = {
    primary: { icon: "text-primary", tile: "border-primary/25 bg-primary/10", spot: "var(--primary)" },
    accent: { icon: "text-accent", tile: "border-accent/25 bg-accent/10", spot: "var(--accent)" },
    success: { icon: "text-success", tile: "border-success/25 bg-success/10", spot: "var(--success)" },
    warning: { icon: "text-warning", tile: "border-warning/25 bg-warning/10", spot: "var(--warning)" },
};

/**
 * Kartu statistik dashboard.
 *
 * Gabungan dua komponen Aceternity: CardSpotlight (sorotan ngikutin kursor) dan
 * NumberTicker (angka naik dari nol).
 *
 * Yang bikin kartu ini bukan cuma pajangan: tiap kartu punya `hint` yang
 * ngejelasin ARTINYA angka, bukan cuma labelnya. "13 akun" itu data;
 * "11 siap dipakai, 2 robux habis" itu informasi.
 */
export function StatCard({ label, value, hint, icon: Icon, href, tone = "primary", suffix = "" }) {
    const styles = TONES[tone] ?? TONES.primary;

    const body = (
        <CardSpotlight color={styles.spot} className="h-full p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">{label}</p>
                    <p className="text-foreground mt-1.5 text-3xl font-semibold tracking-tight">
                        <NumberTicker value={value} suffix={suffix} />
                    </p>
                    {hint && <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{hint}</p>}
                </div>

                {Icon && (
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", styles.tile)}>
                        <Icon className={cn("h-4 w-4", styles.icon)} />
                    </div>
                )}
            </div>
        </CardSpotlight>
    );

    if (!href) return body;

    return (
        <Link href={href} className="hover:border-primary/30 block rounded-2xl transition-colors">
            {body}
        </Link>
    );
}
