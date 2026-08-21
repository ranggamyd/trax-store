import { cn } from "@/lib/utils";

const WIDTHS = {
    compact: "max-w-2xl",
    narrow: "max-w-4xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
};

/**
 * Bungkus konten halaman.
 *
 * Tiga hal dibenerin:
 *
 * 1. `bg-black` dicabut. Body udah punya `bg-background`, dan AmbientBackground
 *    duduk di belakangnya. Ngecat hitam solid di sini nutupin aurora-nya —
 *    jadi efek latar yang baru gak akan pernah kelihatan. Ini bukan teori:
 *    lima halaman ngelakuin ini, dan semuanya bikin Fase 1 gak kelihatan.
 *
 * 2. `min-h-screen` dicabut. Navbar udah makan tinggi di atas, jadi
 *    min-h-screen di sini bikin total tingginya lebih dari viewport dan
 *    nongolin scrollbar palsu di halaman yang isinya pendek.
 *
 * 3. `innerContainer` bisa di-override. Sebelumnya kelas wrapper yang sama
 *    ("text-foreground min-h-screen bg-black p-4 pb-20 md:p-8") ditulis ulang
 *    di lima halaman. Sekarang halaman yang butuh layout flex — /orders dan
 *    /offers — tetep bisa pakai kontainer ini lewat `innerClassName`, jadi
 *    padding & background-nya cuma didefinisiin di SATU tempat.
 */
export function PageContainer({ children, className, innerClassName, width = "default" }) {
    return (
        <main className={cn("text-foreground w-full px-4 pt-4 pb-24 md:px-8 md:pt-6", className)}>
            <div className={cn("mx-auto", WIDTHS[width] ?? WIDTHS.default, innerClassName ?? "space-y-6 md:space-y-8")}>{children}</div>
        </main>
    );
}
