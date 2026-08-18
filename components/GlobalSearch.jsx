"use client";

import { Gamepad2, Package, Search,User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/lib/supabase";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ games: [], items: [], accounts: [] });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        const searchData = async () => {
            if (!query.trim()) {
                setResults({ games: [], items: [], accounts: [] });
                return;
            }

            setLoading(true);
            const searchQuery = `%${query}%`;

            const [gamesRes, itemsRes, accountsRes] = await Promise.all([supabase.from("games").select("id, name").ilike("name", searchQuery).limit(5), supabase.from("items").select("id, item_name, game_id").ilike("item_name", searchQuery).limit(5), supabase.from("accounts").select("id, username").ilike("username", searchQuery).limit(5)]);

            setResults({
                games: gamesRes.data || [],
                items: itemsRes.data || [],
                accounts: accountsRes.data || [],
            });
            setLoading(false);
        };

        const timeoutId = setTimeout(() => {
            searchData();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="border-primary/50 shadow-primary/20 hover:border-primary fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-full border bg-black/80 px-4 py-2 text-sm text-zinc-400 shadow-lg backdrop-blur transition-all hover:text-white">
                <Search className="text-primary h-4 w-4" />
                <span className="hidden md:inline-flex">Cari data...</span>
                <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-500 select-none md:inline-flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen} className="border-zinc-800 bg-zinc-950">
                <Command>
                    <CommandInput placeholder="Ketik apa aja bro (Game, Item, Akun)..." value={query} onValueChange={setQuery} className="text-foreground" />
                    <CommandList>
                        {query && !loading && results.games.length === 0 && results.items.length === 0 && results.accounts.length === 0 && <CommandEmpty>Wah, gak nemu data yang dicari bro.</CommandEmpty>}
                        {loading && <div className="py-6 text-center text-sm text-zinc-500">Bentar, lagi nyari...</div>}

                        {results.games.length > 0 && (
                            <CommandGroup heading="Game">
                                {results.games.map((game) => (
                                    <CommandItem key={game.id} value={`game-${game.id}-${game.name}`} onSelect={() => runCommand(() => router.push(`/games/${game.id}`))} className="aria-selected:bg-primary/20 aria-selected:text-primary cursor-pointer">
                                        <Gamepad2 className="mr-2 h-4 w-4" />
                                        {game.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results.items.length > 0 && (
                            <CommandGroup heading="Item">
                                {results.items.map((item) => (
                                    <CommandItem key={item.id} value={`item-${item.id}-${item.item_name}`} onSelect={() => runCommand(() => router.push(`/items/${item.id}`))} className="aria-selected:bg-accent/20 aria-selected:text-accent cursor-pointer">
                                        <Package className="mr-2 h-4 w-4" />
                                        {item.item_name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results.accounts.length > 0 && (
                            <CommandGroup heading="Akun">
                                {results.accounts.map((acc) => (
                                    <CommandItem key={acc.id} value={`account-${acc.id}-${acc.username}`} onSelect={() => runCommand(() => router.push(`/accounts`))} className="cursor-pointer aria-selected:bg-zinc-800">
                                        <User className="mr-2 h-4 w-4" />
                                        {acc.username}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    );
}
