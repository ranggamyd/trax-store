"use client";

import { Mail, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Input daftar email yang bisa ditambah/dikurangi.
 * Gantiin 2 implementasi duplikat di users/page.js dan profile/page.js.
 *
 * Yang diperbaiki selain warna:
 *
 * 1. `key={index}` diganti key yang stabil. Pakai index bikin React salah
 *    ngeklaim baris waktu ada yang dihapus di tengah — nilai input bisa
 *    kelihatan "pindah" ke baris lain. Karena email-nya belum tentu unik saat
 *    diketik, key-nya digabung index + isinya.
 *
 * 2. Email pertama dikasih penanda "UTAMA" yang kelihatan, bukan cuma
 *    keterangan kecil di bawah. Ini email yang dipakai buat login, jadi
 *    posisinya harus jelas tanpa perlu baca petunjuk.
 *
 * 3. `autoComplete="email"` + type email di semua baris.
 */
export function EmailListInput({ emails, setEmails, label = "Daftar email", primaryPlaceholder = "Email utama (buat login)", secondaryPlaceholder = "Email cadangan", inputClassName }) {
    const updateAt = (index, value) => {
        const next = [...emails];
        next[index] = value;
        setEmails(next);
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}

            <div className="space-y-2">
                {emails.map((email, index) => (
                    <div key={`${index}-${email}`} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                            <Input type="email" autoComplete="email" required={index === 0} value={email} onChange={(e) => updateAt(index, e.target.value)} placeholder={index === 0 ? primaryPlaceholder : secondaryPlaceholder} className={cn("border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9 pl-8", index === 0 && "pr-16", inputClassName)} />
                            {index === 0 && <span className="border-primary/25 bg-primary/12 text-primary pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wide">UTAMA</span>}
                        </div>

                        {emails.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" aria-label="Hapus email ini" onClick={() => setEmails(emails.filter((_, i) => i !== index))} className="text-muted-foreground hover:bg-danger/10 hover:text-danger h-9 w-9 shrink-0">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => setEmails([...emails, ""])} className="border-border text-muted-foreground hover:text-foreground mt-1 w-full border-dashed">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah email cadangan
            </Button>
        </div>
    );
}
