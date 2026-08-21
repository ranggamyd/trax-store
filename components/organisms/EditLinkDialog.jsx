"use client";

import { FormDialog } from "@/components/molecules/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Dialog for editing a private server link.
 * Extracted from duplicate code in games/[id]/page.js and accounts/[id]/page.js.
 */
export function EditLinkDialog({ open, onOpenChange, entityLabel, entityName, link, onLinkChange, onSubmit }) {
    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Edit Private Server Link" titleClassName="text-glow-primary">
            <form onSubmit={onSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label className="text-zinc-400">
                        {entityLabel}: <span className="text-white">{entityName}</span>
                    </Label>
                    <Input placeholder="https://..." value={link} onChange={(e) => onLinkChange(e.target.value)} className="border-zinc-800 bg-zinc-900" />
                </div>
                <Button type="submit" className="bg-primary hover:bg-primary/80 mt-2 w-full font-bold text-black">
                    Update Link
                </Button>
            </form>
        </FormDialog>
    );
}
