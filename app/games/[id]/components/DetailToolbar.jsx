"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { GameItemDialog } from "@/app/games/[id]/components/GameItemDialog";
import { LinkAccountDialog } from "@/app/games/[id]/components/LinkAccountDialog";
import { UrlSearchBar } from "@/components/molecules/UrlSearchBar";
import { Button } from "@/components/ui/button";

/** Toolbar per tab: kolom cari + tombol tambah. Satu-satunya bagian body yang client. */
export function DetailToolbar({ game, allAccounts, gameItems, tab }) {
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isItemOpen, setIsItemOpen] = useState(false);

    const isAccounts = tab === "accounts";

    return (
        <>
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                <UrlSearchBar placeholder={isAccounts ? "Cari username akun..." : "Cari nama item..."} containerClassName="w-full sm:w-64" />

                <Button className="h-9 shrink-0 font-semibold" onClick={() => (isAccounts ? setIsAccountOpen(true) : setIsItemOpen(true))}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    {isAccounts ? "Tautin akun" : "Item baru"}
                </Button>
            </div>

            <LinkAccountDialog game={game} allAccounts={allAccounts} gameItems={gameItems} open={isAccountOpen} onOpenChange={setIsAccountOpen} />
            <GameItemDialog game={game} allAccounts={allAccounts} open={isItemOpen} onOpenChange={setIsItemOpen} />
        </>
    );
}
