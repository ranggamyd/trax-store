"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TemplateFormDialog } from "@/app/templates/components/TemplateFormDialog";

/** Nyetir dialog edit dari ?edit=<id>. Pola yang sama kayak /accounts & /users. */
export function TemplateEditDialog({ template, games }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const close = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("edit");

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return <TemplateFormDialog template={template} games={games} open={Boolean(template)} onOpenChange={(next) => !next && close()} />;
}
