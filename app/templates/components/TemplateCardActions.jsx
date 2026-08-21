"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteTemplate, duplicateTemplate } from "@/app/templates/actions";
import { ActionIcon } from "@/components/atoms/ActionIcon";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";

/** Satu-satunya bagian kartu template yang butuh jadi client component. */
export function TemplateCardActions({ template }) {
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const editHref = (() => {
        const params = new URLSearchParams(searchParams);
        params.set("edit", template.id);
        return `${pathname}?${params}`;
    })();

    const runDuplicate = () => {
        startTransition(async () => {
            const result = await duplicateTemplate(template.id);
            if (result?.error) {
                toast.error("Gagal nyalin", { description: result.error });
                return;
            }
            toast.success("Template disalin", { description: `"${result.title}" udah kebikin, tinggal diedit.` });
        });
    };

    const runDelete = () => {
        startTransition(async () => {
            const result = await deleteTemplate(template.id);
            if (result?.error) {
                toast.error("Gagal hapus", { description: result.error });
                return;
            }
            toast.success(`Template "${template.title}" dihapus`);
        });
    };

    return (
        <div className="flex gap-1">
            <Link href={editHref} scroll={false}>
                <ActionIcon icon={Pencil} title="Edit template" variant="edit" />
            </Link>

            <ActionIcon icon={Copy} title="Duplikat template" variant="primary" onClick={runDuplicate} disabled={isPending} />

            <ConfirmDialog
                trigger={<ActionIcon icon={Trash2} title="Hapus template" variant="delete" disabled={isPending} />}
                title="Hapus template ini?"
                description={
                    <>
                        Template <strong className="text-foreground">{template.title}</strong> bakal ilang dari daftar balesan chat. Gak bisa dibalikin.
                    </>
                }
                confirmText="Hapus template"
                onConfirm={runDelete}
            />
        </div>
    );
}
