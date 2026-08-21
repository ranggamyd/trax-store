"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ textToCopy, className }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast.success("Mantap, link udah masuk clipboard!", {
            description: "Langsung gass paste aja bro.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button variant="ghost" size="icon" className={`text-muted-foreground hover:text-accent text-glow-accent relative h-8 w-8 transition-all ${className}`} onClick={handleCopy}>
            <span className="sr-only">Copy</span>
            {copied ? <Check className="h-4 w-4 scale-100 text-green-500 transition-all" /> : <Copy className="h-4 w-4 scale-100 transition-all" />}
        </Button>
    );
}
