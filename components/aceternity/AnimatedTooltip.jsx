"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * AnimatedTooltip — Aceternity UI, di-port ke JSX.
 *
 * Deretan avatar yang numpuk; kalau di-hover, keluar kartu nama di atasnya yang
 * miring ngikutin posisi kursor. Dipakai di rekap shift mingguan buat nunjukin
 * siapa aja yang jaga tanpa makan tempat.
 *
 * Yang gue ubah dari versi aslinya:
 *
 *   - Avatar-nya inisial dari token warna, bukan <Image> dari URL. Dashboard ini
 *     gak punya foto profil, dan versi aslinya wajib `image` — jadi kalau
 *     dipaksa dipakai, hasilnya kotak pecah.
 *
 *   - `useReducedMotion` dihormatin: tooltip-nya tetep muncul (itu informasi,
 *     bukan dekorasi), tapi tanpa animasi miring dan tanpa spring.
 *
 *   - Tooltip-nya kebuka juga waktu di-FOCUS, bukan cuma hover. Versi aslinya
 *     cuma mouse — jadi isinya mustahil dibaca kalau navigasi pakai keyboard.
 */
export function AnimatedTooltip({ items = [], className }) {
    const [activeId, setActiveId] = useState(null);
    const shouldReduceMotion = useReducedMotion();

    const x = useMotionValue(0);
    const springConfig = { stiffness: 100, damping: 5 };
    const rotate = useSpring(useTransform(x, [-60, 60], [-25, 25]), springConfig);
    const translateX = useSpring(useTransform(x, [-60, 60], [-24, 24]), springConfig);

    const handleMouseMove = (event) => {
        const halfWidth = event.currentTarget.offsetWidth / 2;
        x.set(event.nativeEvent.offsetX - halfWidth);
    };

    return (
        <div className={cn("flex items-center", className)}>
            {items.map((item) => (
                <div key={item.id} className="group relative -mr-2.5 last:mr-0" onMouseEnter={() => setActiveId(item.id)} onMouseLeave={() => setActiveId(null)} onFocus={() => setActiveId(item.id)} onBlur={() => setActiveId(null)}>
                    <AnimatePresence mode="popLayout">
                        {activeId === item.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                    transition: shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 12 },
                                }}
                                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                                style={shouldReduceMotion ? undefined : { translateX, rotate, whiteSpace: "nowrap" }}
                                className="glass absolute -top-14 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center rounded-xl px-3 py-1.5"
                            >
                                <span className="text-foreground text-xs font-semibold">{item.name}</span>
                                {item.detail && <span className="text-muted-foreground text-[10px]">{item.detail}</span>}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button type="button" onMouseMove={handleMouseMove} aria-label={item.detail ? `${item.name} — ${item.detail}` : item.name} className="border-border bg-surface-3 text-foreground/85 relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-transform duration-200 group-hover:z-30 group-hover:scale-110">
                        {item.initials}
                    </button>
                </div>
            ))}
        </div>
    );
}
