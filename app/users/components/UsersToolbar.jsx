"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

import { UserFormDialog } from "@/app/users/components/UserFormDialog";
import { UrlSearchBar } from "@/components/molecules/UrlSearchBar";
import { Button } from "@/components/ui/button";

export function UsersToolbar() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <>
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <UrlSearchBar placeholder="Cari username atau email..." containerClassName="w-full sm:w-64" />

                <Button className="h-9 shrink-0 font-semibold" onClick={() => setIsCreateOpen(true)}>
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Tambah admin
                </Button>
            </div>

            <UserFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </>
    );
}
