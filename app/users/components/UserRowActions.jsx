"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteUser } from "@/app/actions/users";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";

/**
 * Aksi per baris admin.
 *
 * `isSelf` dateng dari server (dibanding sama getCurrentAdmin), bukan dari
 * session di klien. Bedanya penting: tombol hapus buat diri sendiri di-disable
 * berdasarkan identitas yang udah diverifikasi server — dan `deleteUser` juga
 * nolak lagi di sisi server, jadi dua lapis.
 */
export function UserRowActions({ user, isSelf }) {
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const editHref = (() => {
        const params = new URLSearchParams(searchParams);
        params.set("edit", user.id);
        return `${pathname}?${params}`;
    })();

    const runDelete = () => {
        startTransition(async () => {
            const result = await deleteUser(user.id);
            if (result?.error) {
                toast.error("Gagal hapus admin", { description: result.error });
                return;
            }
            toast.success(`Akses ${user.username} dicabut`);
        });
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <Link href={editHref} scroll={false}>
                <ActionIcon icon={Pencil} title="Edit admin" variant="edit" />
            </Link>

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} title={isSelf ? "Gak bisa hapus akun sendiri" : "Cabut akses admin"} variant="delete" disabled={isSelf || isPending} />}
                title="Cabut akses admin ini?"
                description={
                    <>
                        Akses <strong className="text-foreground">{user.username}</strong> bakal dicabut permanen dan dia langsung gak bisa login lagi. Gak bisa dibatalin.
                    </>
                }
                confirmText="Cabut akses"
                onConfirm={runDelete}
            />
        </div>
    );
}
