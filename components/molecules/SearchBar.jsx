import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({ value, onChange, placeholder = "Cari...", className, containerClassName }) {
    return (
        <div className={cn("relative w-full md:w-64", containerClassName)}>
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input placeholder={placeholder} value={value} onChange={onChange} className={cn("text-foreground focus-visible:ring-accent border-zinc-800 bg-zinc-900 pl-9", className)} />
        </div>
    );
}
