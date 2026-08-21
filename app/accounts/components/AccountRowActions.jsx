"use client";

import { CircleDollarSign, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteAccount, toggleAccountRobux } from "@/app/accounts/actions";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";

/**
 * Aksi per baris. Satu-satunya bagian baris tabel yang jadi client component —
 * username, catatan, dan badge status tetep dirender di server.
 *
 * `useTransition` nandain pending TANPA nyimpen salinan data di klien. Habis
 * action-nya kelar, `revalidatePath` di server yang ngirim baris versi baru.
 * Jadi gak ada state ganda yang bisa nyimpang dari isi database.
 */
export function AccountRowActions({ account }) {
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const hasRobux = account.status === "ACTIVE";

    // Link edit nyimpen query yang sekarang, jadi nutup dialog gak ngelempar
    // user balik ke halaman 1 atau ngilangin kata kuncinya.
    const editHref = (() => {
        const params = new URLSearchParams(searchParams);
        params.set("edit", account.id);
        return `${pathname}?${params}`;
    })();

    const runToggle = () => {
        startTransition(async () => {
            const result = await toggleAccountRobux(account.id);
            if (result?.error) {
                toast.error("Gagal ganti status", { description: result.error });
                return;
            }
            toast.success(result.status === "ACTIVE" ? `${account.username}: robux tersedia` : `${account.username}: robux habis`);
        });
    };

    const runDelete = () => {
        startTransition(async () => {
            const result = await deleteAccount(account.id);
            if (result?.error) {
                toast.error("Gagal hapus", { description: result.error });
                return;
            }
            toast.success(`Akun "${account.username}" dihapus`);
        });
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <ActionIcon icon={CircleDollarSign} title={hasRobux ? "Tandai robux habis" : "Tandai robux tersedia"} variant={hasRobux ? "warning" : "success"} onClick={runToggle} disabled={isPending} />

            <Link href={editHref} scroll={false}>
                <ActionIcon icon={Pencil} title="Edit akun" variant="edit" />
            </Link>

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} title="Hapus akun" variant="delete" disabled={isPending} />}
                title="Hapus akun ini?"
                description={
                    <>
                        Akun <strong className="text-foreground">{account.username}</strong> bakal dihapus permanen, bareng semua tautan game dan item-nya. Gak bisa dibalikin.
                    </>
                }
                confirmText="Hapus akun"
                onConfirm={runDelete}
            />
        </div>
    );
}
