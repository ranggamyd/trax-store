"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { AccountFormDialog } from "@/app/accounts/components/AccountFormDialog";
import { UrlSearchBar } from "@/components/molecules/UrlSearchBar";
import { Button } from "@/components/ui/button";

/**
 * Toolbar header /accounts: pencarian + tombol tambah.
 *
 * Ini satu-satunya bagian header yang butuh interaktivitas, jadi cuma bagian
 * ini yang jadi client component. Judul, subjudul, dan ikon tetep dirender
 * di server oleh PageHeader.
 */
export function AccountsToolbar() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <>
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <UrlSearchBar placeholder="Cari username atau catatan..." containerClassName="w-full sm:w-64" />

                <Button className="h-9 shrink-0 font-semibold" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Tambah akun
                </Button>
            </div>

            <AccountFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </>
    );
}
