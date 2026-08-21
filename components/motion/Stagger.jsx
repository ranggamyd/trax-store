"use client";

import { motion, useReducedMotion } from "framer-motion";

import { DURATION, EASE, STAGGER } from "@/lib/motion";

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: STAGGER,
            delayChildren: 0.04,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: DURATION.base, ease: EASE.out },
    },
};

/**
 * Pembungkus buat list yang anaknya masuk berurutan.
 *
 * Pakai variants (bukan delay yang dihitung per index) karena orkestrasinya
 * diurus di parent. Jadi nambah/ngurangin item gak bikin timing-nya kacau,
 * dan kita gak perlu nge-pass `index` ke tiap anak cuma buat animasi.
 *
 * Pemakaian:
 *   <StaggerGroup>
 *       {rows.map((r) => <StaggerItem key={r.id}>...</StaggerItem>)}
 *   </StaggerGroup>
 */
export function StaggerGroup({ children, className, as = "div", ...props }) {
    const shouldReduceMotion = useReducedMotion();
    const Component = motion[as] ?? motion.div;

    if (shouldReduceMotion) {
        return (
            <div className={className} {...props}>
                {children}
            </div>
        );
    }

    return (
        <Component className={className} variants={containerVariants} initial="hidden" animate="show" {...props}>
            {children}
        </Component>
    );
}

export function StaggerItem({ children, className, as = "div", ...props }) {
    const shouldReduceMotion = useReducedMotion();
    const Component = motion[as] ?? motion.div;

    if (shouldReduceMotion) {
        return (
            <div className={className} {...props}>
                {children}
            </div>
        );
    }

    return (
        <Component className={className} variants={itemVariants} {...props}>
            {children}
        </Component>
    );
}
