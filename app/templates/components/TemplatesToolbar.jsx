"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { TemplateFormDialog } from "@/app/templates/components/TemplateFormDialog";
import { UrlSearchBar } from "@/components/molecules/UrlSearchBar";
import { Button } from "@/components/ui/button";

export function TemplatesToolbar({ games }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <>
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <UrlSearchBar placeholder="Cari judul atau isi pesan..." containerClassName="w-full sm:w-64" />

                <Button className="h-9 shrink-0 font-semibold" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Template baru
                </Button>
            </div>

            <TemplateFormDialog games={games} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </>
    );
}
