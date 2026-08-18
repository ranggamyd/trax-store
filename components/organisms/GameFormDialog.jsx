"use client";

import { FormDialog } from "@/components/molecules/FormDialog";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Game create/edit form dialog.
 * Extracted from duplicate code in games/page.js and games/[id]/page.js.
 */
export function GameFormDialog({ open, onOpenChange, isEdit = false, register, errors, watch, setValue, onSubmit }) {
    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Edit Game" : "Game Baru Nih"}>
            <form onSubmit={onSubmit} className="space-y-4 pt-4">
                <FormField label="Nama Game" id="name" error={errors.name?.message} register={register("name")} placeholder="Cth: Blox Fruits" />
                <FormField label="Link Gambar (Opsional)" id="image_url" error={errors.image_url?.message} register={register("image_url")} placeholder="https://..." />
                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="requires_private_server" checked={watch("requires_private_server") || false} onCheckedChange={(val) => setValue("requires_private_server", val)} />
                    <Label htmlFor="requires_private_server">Buyer Wajib Join</Label>
                </div>
                <Button type="submit" className="bg-accent hover:bg-accent/80 mt-4 w-full font-bold text-black">
                    Gass Simpan
                </Button>
            </form>
        </FormDialog>
    );
}
