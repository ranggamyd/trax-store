"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Dynamic email list input with add/remove rows.
 * Replaces 2 duplicate implementations in users/page.js and profile/page.js.
 */
export function EmailListInput({ emails, setEmails, label = "Daftar Email", primaryPlaceholder = "Email Utama", secondaryPlaceholder = "Email Cadangan", inputClassName = "bg-zinc-900 border-zinc-800" }) {
    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div className="space-y-2">
                {emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            type="email"
                            required={index === 0}
                            value={email}
                            onChange={(e) => {
                                const newEmails = [...emails];
                                newEmails[index] = e.target.value;
                                setEmails(newEmails);
                            }}
                            className={inputClassName}
                            placeholder={index === 0 ? primaryPlaceholder : secondaryPlaceholder}
                        />
                        {emails.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => setEmails(emails.filter((_, i) => i !== index))} className="shrink-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-500">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setEmails([...emails, ""])} className={`mt-2 w-full ${inputClassName} border-dashed text-zinc-400 hover:text-white`}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Email Lain
            </Button>
            <p className="mt-1 text-xs text-zinc-500">Email baris pertama akan jadi email utama.</p>
        </div>
    );
}
