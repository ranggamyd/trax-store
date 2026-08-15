"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

/**
 * Reusable combobox select component.
 * Replaces 12+ copy-pasted Popover+Command patterns across the codebase.
 *
 * Props:
 * - items: Array of selectable items
 * - value: Currently selected value (item ID or similar)
 * - onSelect: (item) => void
 * - getItemValue: (item) => string (for Command filtering, defaults to item.name)
 * - getItemId: (item) => string (for matching selected, defaults to item.id)
 * - renderItem: (item) => ReactNode (custom render per item)
 * - placeholder: Trigger button placeholder
 * - searchPlaceholder: Search input placeholder
 * - emptyText: Text when no results
 * - onCreateNew: (searchTerm) => void (optional, for inline creation)
 * - createNewLabel: (searchTerm) => string (button label for create)
 * - triggerClassName: Additional classes for trigger button
 * - open/onOpenChange: Optional controlled open state
 */
export function ComboboxSelect({ items = [], value, onSelect, getItemValue = (item) => item.name || item.username || item.item_name || "", getItemId = (item) => item.id, renderItem, placeholder = "-- Pilih --", searchPlaceholder = "Cari...", emptyText = "Gak ketemu bro.", onCreateNew, createNewLabel = (term) => `Tambah "${term}"`, triggerClassName, open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

    const selectedItem = items.find((item) => getItemId(item) === value);
    const displayValue = selectedItem ? getItemValue(selectedItem) : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className={cn("flex w-full flex-1 items-center justify-between border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white", triggerClassName)}>
                    {displayValue}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] border-zinc-800 bg-zinc-950 p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="text-foreground" value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty className="p-4 text-center text-sm text-zinc-400">
                            <p className="mb-2">{emptyText}</p>
                            {onCreateNew && search.trim() && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-primary border-primary hover:bg-primary/20 mt-2 w-full"
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
                                    className="text-foreground aria-selected:bg-primary/20 aria-selected:text-primary cursor-pointer"
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === getItemId(item) ? "opacity-100" : "opacity-0")} />
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
