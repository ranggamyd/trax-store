"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Dynamic repeater field for add/remove rows.
 * Used for item-links in add-account dialog, account-links in add-item dialog, etc.
 *
 * Props:
 * - items: array of row data
 * - setItems: setter for items array
 * - label: section label
 * - addLabel: button label for adding a row
 * - emptyRow: default object for new rows (e.g. { item_id: "", new_name: "" })
 * - renderRow: (item, index, { update, remove }) => ReactNode
 */
export function RepeaterField({ items, setItems, label = "Items", addLabel = "Tambah", emptyRow = {}, renderRow, addButtonClassName = "h-7 text-xs border-primary text-primary hover:bg-primary/20" }) {
    const addRow = () => setItems([...items, { ...emptyRow }]);

    const removeRow = (index) => {
        const newArr = [...items];
        newArr.splice(index, 1);
        setItems(newArr);
    };

    const updateRow = (index, updates) => {
        const newArr = [...items];
        newArr[index] = { ...newArr[index], ...updates };
        setItems(newArr);
    };

    return (
        <div className="border-border mt-4 space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRow} className={addButtonClassName}>
                    <Plus className="mr-1 h-3 w-3" /> {addLabel}
                </Button>
            </div>
            {items.map((item, idx) => (
                <div key={idx} className="mt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        {renderRow(item, idx, {
                            update: (updates) => updateRow(idx, updates),
                            remove: () => removeRow(idx),
                        })}
                        <Button type="button" variant="ghost" size="icon" className="text-danger hover:bg-danger-muted hover:text-danger h-10 w-10 shrink-0" onClick={() => removeRow(idx)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
