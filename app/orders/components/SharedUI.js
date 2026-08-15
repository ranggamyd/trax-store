"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckIcon, CopyIcon } from "lucide-react";

export const DetailSection = ({ title, icon, children }) => (
    <div className="group/section relative mb-5 rounded-2xl border border-white/[0.03] bg-zinc-950/40 p-4 shadow-lg sm:p-5">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.01] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/section:opacity-100"></div>
        <div className="relative z-10 mb-4 flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-xl p-2 shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all">{icon}</div>
            <h3 className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-base font-bold tracking-tight text-transparent">{title}</h3>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>
    </div>
);

export const DetailItem = ({ label, value, valueClass = "text-zinc-200", icon, copyable }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value || value === "-") return;
        navigator.clipboard.writeText(typeof value === "string" ? value : JSON.stringify(value));
        setCopied(true);
        toast.success(`${label} dicopy!`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`group/item flex flex-col gap-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5 transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/50 ${copyable ? "cursor-pointer" : ""}`} onClick={copyable ? handleCopy : undefined}>
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                    <div className="group-hover/item:text-primary text-zinc-500 transition-colors">{icon}</div>
                    {label}
                </span>
                {copyable && (copied ? <CheckIcon className="h-3 w-3 shrink-0 text-green-500" /> : <CopyIcon className="h-3 w-3 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover/item:opacity-100" />)}
            </div>
            <span className={`text-xs font-semibold ${valueClass} truncate`} title={typeof value === "string" ? value : ""}>
                {value !== undefined && value !== null && value !== "" ? value : "-"}
            </span>
        </div>
    );
};

export const CopyablePill = ({ value }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(`${value} dicopy!`);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 group inline-flex w-fit cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs font-bold shadow-[0_0_10px_rgba(var(--primary),0.05)] transition-all hover:shadow-[0_0_15px_rgba(var(--primary),0.15)]">
            <span className="max-w-[150px] truncate">{value}</span>
            {copied ? <CheckIcon className="h-3 w-3 shrink-0 text-green-500" /> : <CopyIcon className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />}
        </button>
    );
};
