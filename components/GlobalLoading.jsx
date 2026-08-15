"use client";
import { Gamepad2 } from "lucide-react";

export function GlobalLoading({ text = "Lagi nge-load markas..." }) {
    return (
        <div className="flex h-[70vh] items-center justify-center">
            <div className="flex animate-pulse flex-col items-center gap-4">
                <Gamepad2 className="text-primary h-16 w-16 animate-bounce" />
                <p className="text-primary neon-text-primary text-xl font-bold tracking-widest uppercase">{text}</p>
            </div>
        </div>
    );
}
