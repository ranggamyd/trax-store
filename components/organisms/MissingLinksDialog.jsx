"use client";

import { FormDialog } from "@/components/molecules/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Dialog for filling in missing private server links when toggling requires_private_server.
 * Extracted from duplicate code in games/page.js and games/[id]/page.js.
 */
export function MissingLinksDialog({ open, onOpenChange, missingLinks, setMissingLinks, onSubmit }) {
    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title="Wajib Isi Link!" titleClassName="text-xl font-bold text-danger" maxWidth="max-w-lg">
            <p className="text-muted-foreground mt-2 text-sm">
                Karena opsi &quot;Buyer Wajib Join&quot; diaktifkan, <strong>{missingLinks.length} akun</strong> ini butuh private server link. Isi dulu bos sebelum bisa simpan!
            </p>
            <form onSubmit={onSubmit} className="mt-2 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                {missingLinks.map((ml, idx) => (
                    <div key={ml.id} className="space-y-1">
                        <Label className="text-accent">{ml.accounts?.username}</Label>
                        <Input
                            placeholder="https://..."
                            value={ml.private_server_link || ""}
                            onChange={(e) => {
                                const updated = [...missingLinks];
                                updated[idx].private_server_link = e.target.value;
                                setMissingLinks(updated);
                            }}
                            required
                            className="border-border bg-surface-2"
                        />
                    </div>
                ))}
                <Button type="submit" className="bg-danger text-danger-foreground hover:bg-danger/90 mt-4 w-full font-bold">
                    Simpan & Lanjutkan Update
                </Button>
            </form>
        </FormDialog>
    );
}
