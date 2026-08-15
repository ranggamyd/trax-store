import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Reusable form dialog wrapper.
 * Eliminates Dialog+DialogContent+DialogHeader+DialogTitle boilerplate.
 */
export function FormDialog({ open, onOpenChange, title, titleClassName = "neon-text-accent", children, maxWidth }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`text-foreground border-zinc-800 bg-zinc-950 ${maxWidth || ""}`}>
                <DialogHeader>
                    <DialogTitle className={titleClassName}>{title}</DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
