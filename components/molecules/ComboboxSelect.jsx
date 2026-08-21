"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Combobox select. Gantiin 12+ pola Popover+Command yang di-copy-paste.
 *
 * BUG YANG DIBENERIN: lebar dropdown-nya dulu `w-[var(--radix-popover-trigger-width)]`.
 * Itu variabel RADIX, sedangkan project ini pakai @base-ui/react — jadi
 * variabelnya gak pernah ada, nilainya invalid, dan lebarnya diam-diam jatuh ke
 * `w-72` bawaan PopoverContent. Akibatnya dropdown sering lebih sempit atau
 * lebih lebar dari trigger-nya tanpa alasan yang kelihatan.
 * Base UI namanya `--anchor-width`.
 *
 * Props:
 * - items, value, onSelect
 * - getItemValue / getItemId / renderItem
 * - placeholder / searchPlaceholder / emptyText
 * - onCreateNew + createNewLabel (bikin item baru langsung dari kolom cari)
 * - triggerClassName / contentClassName
 * - open / onOpenChange (opsional, buat controlled)
 */
export function ComboboxSelect({ items = [], value, onSelect, getItemValue = (item) => item.name || item.username || item.item_name || "", getItemId = (item) => item.id, renderItem, placeholder = "-- Pilih --", searchPlaceholder = "Cari...", emptyText = "Gak ketemu.", onCreateNew, createNewLabel = (term) => `Tambah "${term}"`, triggerClassName, contentClassName, disabled, open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

    const selectedItem = items.find((item) => getItemId(item) === value);
    const hasSelection = Boolean(selectedItem);
    const displayValue = hasSelection ? getItemValue(selectedItem) : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    // Placeholder dibedain warnanya dari nilai terpilih. Dulu dua-duanya
                    // `text-zinc-300`, jadi "-- Pilih game --" kelihatan kayak udah kepilih.
                    className={cn("border-border bg-input/60 hover:bg-surface-3 hover:text-foreground flex h-9 w-full flex-1 items-center justify-between font-normal", hasSelection ? "text-foreground" : "text-muted-foreground", triggerClassName)}
                >
                    <span className="truncate">{displayValue}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className={cn("border-border bg-popover w-(--anchor-width) min-w-56 p-0", contentClassName)}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="text-foreground" value={search} onValueChange={setSearch} />
                    <CommandList className="custom-scrollbar">
                        <CommandEmpty className="text-muted-foreground p-4 text-center text-sm">
                            <p className="mb-2">{emptyText}</p>
                            {onCreateNew && search.trim() && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-primary border-primary/50 hover:bg-primary/15 mt-2 w-full"
                                    onClick={() => {
                                        onCreateNew(search.trim());
                                        setSearch("");
                                        setOpen(false);
                                    }}
                                >
                                    <Plus className="mr-1 h-4 w-4" />
                                    {createNewLabel(search.trim())}
                                </Button>
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={getItemId(item)}
                                    value={getItemValue(item)}
                                    onSelect={() => {
                                        onSelect(item);
                                        setSearch("");
                                        setOpen(false);
                                    }}
                                    className="text-foreground aria-selected:bg-primary/15 aria-selected:text-primary cursor-pointer"
                                >
                                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === getItemId(item) ? "opacity-100" : "opacity-0")} />
                                    {renderItem ? renderItem(item) : getItemValue(item)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
