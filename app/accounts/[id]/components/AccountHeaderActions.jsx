"use client";

import { CircleDollarSign, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteAccount, toggleAccountRobux } from "@/app/accounts/actions";
import { AccountFormDialog } from "@/app/accounts/components/AccountFormDialog";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";

/**
 * Aksi di header detail akun.
 *
 * Dialog edit-nya PAKAI ULANG AccountFormDialog dari halaman daftar. Versi lama
 * punya form edit sendiri di sini yang cuma ngurus username + notes — jadi
 * status robux gak bisa diubah dari halaman detail, padahal tombol toggle-nya
 * ada di sebelahnya. Dua form buat entitas yang sama juga berarti dua tempat
 * yang harus diinget tiap ada field baru.
 */
export function AccountHeaderActions({ account }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditOpen, setIsEditOpen] = useState(false);

    const hasRobux = account.status === "ACTIVE";

    const runToggle = () => {
        startTransition(async () => {
            const result = await toggleAccountRobux(account.id);
            if (result?.error) {
                toast.error("Gagal ganti status", { description: result.error });
                return;
            }
            toast.success(result.status === "ACTIVE" ? "Ditandai: robux tersedia" : "Ditandai: robux habis");
        });
    };

    const runDelete = () => {
        startTransition(async () => {
            const result = await deleteAccount(account.id);
            if (result?.error) {
                toast.error("Gagal hapus akun", { description: result.error });
                return;
            }
            toast.success(`Akun "${account.username}" dihapus`);
            router.push("/accounts");
        });
    };

    return (
        <>
            <ActionIcon icon={CircleDollarSign} title={hasRobux ? "Tandai robux habis" : "Tandai robux tersedia"} variant={hasRobux ? "warning" : "success"} onClick={runToggle} disabled={isPending} className="h-10 w-10" />

            <ActionIcon icon={Pencil} title="Edit akun" variant="edit" onClick={() => setIsEditOpen(true)} className="h-10 w-10" />

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} title="Hapus akun" variant="delete" disabled={isPending} className="h-10 w-10" />}
                title="Hapus akun ini?"
                description={
                    <>
                        Akun <strong className="text-foreground">{account.username}</strong> bakal dihapus permanen, bareng semua tautan game dan item-nya. Gak bisa dibalikin.
                    </>
                }
                confirmText="Hapus akun"
                onConfirm={runDelete}
            />

            <AccountFormDialog account={account} open={isEditOpen} onOpenChange={setIsEditOpen} />
        </>
    );
}
