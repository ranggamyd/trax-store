"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function LightboxImage({ src, alt, className, style }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Image
                unoptimized
                src={src}
                alt={alt || "Image"}
                width={800}
                height={800}
                className={`cursor-pointer transition-transform hover:scale-105 hover:brightness-110 object-contain ${className || ""}`}
                style={{ height: 'auto', ...style }}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
            />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[90vh] max-w-[90vw] items-center justify-center overflow-hidden border-none bg-transparent p-0 shadow-none [&>button]:rounded-full [&>button]:bg-black/50 [&>button]:p-2 [&>button]:text-white [&>button]:hover:bg-black/80">
                    <DialogTitle className="sr-only">Image preview</DialogTitle>
                    <Image 
                        unoptimized
                        src={src} 
                        alt={alt || "Preview"} 
                        width={1200}
                        height={1200}
                        className="max-h-[90vh] max-w-full cursor-zoom-out rounded-lg object-contain" 
                        onClick={() => setOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
