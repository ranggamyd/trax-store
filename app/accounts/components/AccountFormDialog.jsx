"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createAccount, updateAccount } from "@/app/accounts/actions";
import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { accountSchema } from "@/lib/schemas";

const EMPTY = { username: "", notes: "", has_robux: false };

/**
 * Dialog tambah/edit akun.
 *
 * Satu komponen buat dua mode karena field-nya identik — dua komponen berarti
 * dua tempat yang harus diinget tiap kali ada field baru.
 *
 * Checkbox mentah yang lama (`<input type="checkbox">` dengan kelas zinc)
 * diganti Switch. Bukan cuma soal tampilan: switch itu affordance buat
 * "keadaan nyala/mati", dan status robux memang keadaan — bukan pilihan yang
 * baru berlaku setelah submit.
 */
export function AccountFormDialog({ account = null, open, onOpenChange }) {
    const isEdit = Boolean(account);

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(accountSchema),
        defaultValues: EMPTY,
    });

    // Isi ulang form tiap dialog dibuka. Tanpa ini, buka-edit-akun-A lalu
    // buka-edit-akun-B nampilin data A karena form-nya gak pernah di-reset.
    useEffect(() => {
        if (!open) return;

        reset(
            account
                ? {
                      username: account.username ?? "",
                      notes: account.notes ?? "",
                      has_robux: account.status === "ACTIVE",
                  }
                : EMPTY
        );
    }, [open, account, reset]);

    // useWatch, bukan watch(): watch() ngembaliin fungsi baru tiap render, jadi
    // React Compiler nyerah nge-memo seluruh komponen ini. useWatch itu hook
    // beneran yang cuma nge-subscribe ke satu field.
    const hasRobux = useWatch({ control, name: "has_robux" });

    const onSubmit = async (values) => {
        const result = isEdit ? await updateAccount(account.id, values) : await createAccount(values);

        if (result?.error) {
            toast.error(isEdit ? "Gagal nyimpen" : "Gagal nambah akun", { description: result.error });
            return;
        }

        toast.success(isEdit ? "Perubahan kesimpen" : `Akun "${values.username}" masuk daftar`);
        onOpenChange(false);
    };

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Edit akun" : "Tambah akun Roblox"} description={isEdit ? `Ngubah data untuk ${account.username}.` : "Simpen username Roblox baru ke stok internal."}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <FormField label="Username Roblox" id="username" required error={errors.username?.message} register={register("username")} placeholder="misal: TraxStore_01" />

                <FormField label="Catatan" id="notes" error={errors.notes?.message} register={register("notes")} placeholder="Opsional — email, sumber, patokan harga..." hint="Cuma kelihatan di dashboard internal." />

                {/* Switch: label + penjelasan konsekuensinya, bukan cuma "Akun Robux?" */}
                <div className="border-border bg-surface-1/50 flex items-start justify-between gap-4 rounded-xl border p-3.5">
                    <div className="min-w-0">
                        <Label htmlFor="has_robux" className="text-sm font-medium">
                            Robux tersedia
                        </Label>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{hasRobux ? "Akun ini bakal ditandai siap dipakai." : "Akun ini bakal ditandai robux-nya habis."}</p>
                    </div>
                    <Switch id="has_robux" checked={Boolean(hasRobux)} onCheckedChange={(checked) => setValue("has_robux", checked, { shouldDirty: true })} className="mt-0.5 shrink-0" />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button type="submit" className="font-semibold" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Nyimpen...
                            </>
                        ) : isEdit ? (
                            "Simpen perubahan"
                        ) : (
                            "Tambah akun"
                        )}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}
