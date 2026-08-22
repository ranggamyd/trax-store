import { cn } from "@/lib/utils";

/**
 * Meteors — Aceternity UI, di-port ke JSX.
 *
 * Garis-garis cahaya yang melesat diagonal. Dipakai SATU KALI di kartu hero
 * dashboard — kalau dipasang di semua kartu, dia berhenti jadi aksen dan mulai
 * jadi gangguan.
 *
 * Yang gue ubah dari versi aslinya, dan ini yang penting:
 *
 *   - SERVER COMPONENT. Aslinya `"use client"` cuma karena dia pakai
 *     `Math.random()` buat posisi & delay tiap meteor.
 *
 *   - `Math.random()` DIGANTI sebaran deterministik dari index. Alasannya bukan
 *     kerapian: di komponen yang dirender server DAN klien, Math.random() ngasih
 *     nilai beda di dua sisi — jadi React ngeluh markup-nya gak cocok
 *     (hydration mismatch). Sebaran dari index selalu sama di dua sisi, dan
 *     hasil visualnya tetep gak kelihatan berpola karena angka pengalinya
 *     dipilih ganjil.
 */
export function Meteors({ count = 14, className }) {
    return (
        <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
            {Array.from({ length: count }).map((_, index) => {
                // Pengali ganjil + modulo bikin sebarannya kelihatan acak tapi
                // hasilnya identik tiap render — di server maupun di klien.
                const left = ((index * 37) % 100) + "%";
                const top = ((index * 17) % 40) + "%";
                const delay = ((index * 13) % 50) / 10;
                const duration = 3 + ((index * 7) % 40) / 10;

                return (
                    <span
                        key={index}
                        className="bg-muted-foreground absolute h-0.5 w-0.5 rotate-[215deg] rounded-full"
                        style={{
                            left,
                            top,
                            animation: `meteor ${duration}s linear ${delay}s infinite`,
                            boxShadow: "0 0 0 1px rgb(255 255 255 / 0.08)",
                        }}
                    >
                        {/* Ekornya: gradient yang menipis ke arah datang */}
                        <span className="absolute top-1/2 -z-10 h-px w-[60px] -translate-y-1/2" style={{ background: "linear-gradient(90deg, var(--muted-foreground), transparent)" }} />
                    </span>
                );
            })}
        </div>
    );
}
