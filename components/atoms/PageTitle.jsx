import { cn } from "@/lib/utils";

/**
 * Judul halaman. Gantiin `NeonTitle`.
 *
 * Tiga hal yang diubah, dan alasannya:
 *
 * 1. GLOW DICABUT DARI JUDUL. Dulu tiap judul halaman pakai text-shadow neon.
 *    Kalau semuanya nyala, gak ada yang nyala — glow kehilangan fungsinya
 *    sebagai penanda. Sekarang glow-nya pindah ke tile ikon: satu titik terang
 *    per layar, jadi matanya tau harus mendarat di mana.
 *
 * 2. `uppercase tracking-widest` DILEPAS dari judul. Huruf kapital semua itu
 *    ngilangin bentuk kata (ascender/descender), dan itu justru yang dipakai
 *    mata buat baca cepat. Buat dashboard yang dibuka 8 jam sehari, itu pajak
 *    yang mahal. Gaya uppercase-nya dipindah ke eyebrow — teks kecil di atas
 *    judul — di mana dia berfungsi sebagai label, bukan bacaan.
 *
 * 3. Warna dari token, plus tile ikon berkaca biar ikonnya punya "rumah"
 *    ketimbang ngambang di sebelah teks.
 */
const ACCENTS = {
    primary: { text: "text-primary", tile: "bg-primary/10 border-primary/25", glow: "var(--glow-primary)" },
    accent: { text: "text-accent", tile: "bg-accent/10 border-accent/25", glow: "var(--glow-accent)" },
    warning: { text: "text-warning", tile: "bg-warning/10 border-warning/25", glow: "0 0 24px rgb(251 191 36 / 0.25)" },
    danger: { text: "text-danger", tile: "bg-danger/10 border-danger/25", glow: "var(--glow-danger)" },
    // `blue` disimpen karena beberapa halaman masih manggil color="blue".
    // Dipetakan ke accent supaya jumlah warna aksen gak balik jadi empat lagi.
    blue: { text: "text-accent", tile: "bg-accent/10 border-accent/25", glow: "var(--glow-accent)" },
};

export function PageTitle({ children, eyebrow, color = "primary", icon: Icon, as: Component = "h1", className }) {
    const accent = ACCENTS[color] ?? ACCENTS.primary;

    return (
        <div className="flex items-center gap-3.5">
            {Icon && (
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", accent.tile)} style={{ boxShadow: accent.glow }}>
                    <Icon className={cn("h-5 w-5", accent.text)} />
                </div>
            )}
            <div className="min-w-0">
                {eyebrow && <p className="text-muted-foreground mb-0.5 text-[10px] font-bold tracking-[0.18em] uppercase">{eyebrow}</p>}
                <Component className={cn("text-foreground truncate text-2xl leading-tight font-semibold tracking-tight md:text-3xl", className)}>{children}</Component>
            </div>
        </div>
    );
}
