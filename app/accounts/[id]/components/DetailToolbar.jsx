"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { AddItemDialog } from "@/app/accounts/[id]/components/AddItemDialog";
import { LinkGameDialog } from "@/app/accounts/[id]/components/LinkGameDialog";
import { UrlSearchBar } from "@/components/molecules/UrlSearchBar";
import { Button } from "@/components/ui/button";

/**
 * Toolbar per tab: kolom cari + tombol tambah.
 *
 * Satu komponen buat dua tab karena bentuknya identik — cuma dialog yang
 * dibuka yang beda. Ini juga satu-satunya bagian body halaman yang client;
 * tabel game dan item dirender server.
 */
export function DetailToolbar({ accountId, allGames, tab }) {
    const [isGameOpen, setIsGameOpen] = useState(false);
    const [isItemOpen, setIsItemOpen] = useState(false);

    const isGames = tab === "games";

    return (
        <>
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                <UrlSearchBar placeholder={isGames ? "Cari nama game..." : "Cari nama item..."} containerClassName="w-full sm:w-64" />

                <Button className="h-9 shrink-0 font-semibold" onClick={() => (isGames ? setIsGameOpen(true) : setIsItemOpen(true))}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {isGames ? "Tautin game" : "Tautin item"}
                </Button>
            </div>

            <LinkGameDialog accountId={accountId} allGames={allGames} open={isGameOpen} onOpenChange={setIsGameOpen} />
            <AddItemDialog accountId={accountId} allGames={allGames} open={isItemOpen} onOpenChange={setIsItemOpen} />
        </>
    );
}
