import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Field form dengan label, input, dan pesan error.
 *
 * Dua mode:
 *   1. Kasih `register` (integrasi react-hook-form)
 *   2. Kasih `children` (combobox, switch, textarea, dll)
 *
 * Yang diperbaiki:
 *
 * 1. `id` auto-generate lewat useId kalau gak dikasih, dan Label-nya
 *    disambungin. Sebelumnya `id` opsional tapi Label selalu pakai htmlFor —
 *    jadi kalau `id` gak dikasih, htmlFor-nya undefined dan labelnya mati.
 *
 * 2. Error pakai `role="alert"` + `aria-invalid` di input, bukan cuma teks
 *    merah. Screen reader gak bisa "lihat" warna — tanpa ini, user yang pakai
 *    screen reader submit form berkali-kali tanpa tau kenapa gagal.
 *
 * 3. Bintang "wajib" gak lagi cuma warna: ditambah aria-hidden + `required`
 *    di input beneran, jadi maknanya kesampaikan lewat dua jalur.
 */
export function FormField({ label, error, required, children, hint, register, placeholder, id, type = "text", inputClassName }) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;

    return (
        <div className="space-y-2">
            {label && (
                <Label htmlFor={fieldId}>
                    {label}
                    {required && (
                        <span className="text-danger ml-0.5" aria-hidden="true">
                            *
                        </span>
                    )}
                </Label>
            )}

            {children || <Input id={fieldId} type={type} placeholder={placeholder} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className={cn("border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9", inputClassName)} {...(register || {})} />}

            {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}

            {error && (
                <p id={errorId} role="alert" className="text-danger text-xs font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}
