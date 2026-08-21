"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Input password dengan toggle lihat/sembunyi.
 * Gantiin 3 implementasi duplikat di login, users, dan profile.
 *
 * Tiga hal yang diperbaiki dari versi lama:
 *
 * 1. Warna pindah ke token (default-nya dulu literal "bg-zinc-900 border-zinc-800").
 *
 * 2. `id` disambungin ke Label lewat htmlFor. Sebelumnya Label-nya ngambang —
 *    ngeklik teks "Password" gak mindahin fokus ke input, dan screen reader
 *    gak tau label itu punya field mana.
 *
 * 3. `autoComplete` bisa diatur. Tanpa ini, password manager sering salah nebak
 *    antara form login dan form ganti password — dan itu bikin admin nyimpen
 *    password baru ke entri yang salah.
 */
export function PasswordInput({ label = "Password", value, onChange, required = false, placeholder = "", minLength = 6, autoComplete = "current-password", id, className }) {
    const [show, setShow] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className="space-y-2">
            {label && <Label htmlFor={inputId}>{label}</Label>}
            <div className="relative">
                <Input id={inputId} type={show ? "text" : "password"} required={required} value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} className={cn("border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 pr-10", className)} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyiin password" : "Tampilin password"} className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}
