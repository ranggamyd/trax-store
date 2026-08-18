"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Password input with show/hide toggle.
 * Replaces 3 duplicate implementations in login, users, and profile pages.
 */
export function PasswordInput({ label = "Password", value, onChange, required = false, placeholder = "", minLength = 6, className = "bg-zinc-900 border-zinc-800" }) {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div className="relative">
                <Input type={show ? "text" : "password"} required={required} value={value} onChange={onChange} className={`${className} pr-10`} placeholder={placeholder} minLength={minLength} />
                <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}
