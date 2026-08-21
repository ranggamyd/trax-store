"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

/**
 * Kolom pencarian yang nyimpen query-nya di URL (?q=...).
 *
 * Kenapa di URL, bukan di useState:
 *   - Hasil pencarian jadi BISA DI-SHARE dan di-bookmark. "Cek akun yang ini"
 *     tinggal kirim link, gak perlu "buka accounts terus cari xxx".
 *   - Tombol back browser jalan sesuai harapan.
 *   - Yang paling penting: query-nya kebaca Server Component, jadi filternya
 *     bisa dikerjain DATABASE lewat .ilike(), bukan di browser setelah semua
 *     baris ditarik. Yang lama nge-`select("*")` tanpa limit terus `.filter()`
 *     di render — aman di 100 baris, mati di 10.000.
 *
 * Debounce 300ms: cukup lama buat ngelewatin ketikan cepat, cukup pendek biar
 * gak kerasa nyangkut. `useTransition` yang nyediain indikator pending, jadi
 * user tau requestnya jalan tanpa layarnya di-blok.
 */
export function UrlSearchBar({ placeholder = "Cari apa nih...", paramName = "q", className, containerClassName }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const urlValue = searchParams.get(paramName) ?? "";

    const [value, setValue] = useState(urlValue);
    const [seenUrlValue, setSeenUrlValue] = useState(urlValue);
    const [lastPushed, setLastPushed] = useState(urlValue);
    const timerRef = useRef(null);

    // Sinkron balik kalau URL berubah dari LUAR (tombol back, klik link, reset).
    //
    // Pola resmi React "adjust state when props change": setState waktu render,
    // BUKAN di useEffect. Versi useEffect nge-render dua kali per perubahan URL,
    // dan lint-nya bener nolak itu.
    //
    // Perbandingan ke `lastPushed` itu inti pertahanannya. Tanpa itu ada bug
    // nyata: user ngetik "ab", debounce dari "a" nembak duluan, URL jadi "a",
    // terus sinkronisasinya nge-reset input balik ke "a" — huruf yang baru
    // diketik ilang. Push kita sendiri harus diabaikan; cuma perubahan dari
    // luar yang boleh nimpa isi input.
    //
    // `lastPushed` disimpen di state, bukan ref, karena ref gak boleh dibaca
    // waktu render.
    if (urlValue !== seenUrlValue) {
        setSeenUrlValue(urlValue);
        if (urlValue !== lastPushed) setValue(urlValue);
    }

    const pushQuery = (next) => {
        setLastPushed(next);

        const params = new URLSearchParams(searchParams);
        if (next) params.set(paramName, next);
        else params.delete(paramName);

        // Balik ke halaman 1 tiap query ganti — kalau nggak, user bisa nyangkut
        // di halaman 7 dari hasil yang cuma punya 2 halaman, dan lihat kosong.
        params.delete("page");

        startTransition(() => {
            router.replace(`${pathname}?${params}`, { scroll: false });
        });
    };

    const handleChange = (e) => {
        const next = e.target.value;
        setValue(next);

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => pushQuery(next.trim()), DEBOUNCE_MS);
    };

    const handleClear = () => {
        clearTimeout(timerRef.current);
        setValue("");
        pushQuery("");
    };

    // Bersihin timer yang masih nggantung waktu komponen dibongkar, biar gak
    // ada router.replace yang nembak setelah user pindah halaman.
    useEffect(() => () => clearTimeout(timerRef.current), []);

    return (
        <div className={cn("relative w-full md:w-64", containerClassName)}>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">{isPending ? <Loader2 className="text-primary h-4 w-4 animate-spin" /> : <Search className="text-muted-foreground h-4 w-4" />}</span>

            <Input type="search" value={value} onChange={handleChange} placeholder={placeholder} aria-label={placeholder} className={cn("text-foreground placeholder:text-muted-foreground/70 border-border bg-input/60 focus-visible:border-ring focus-visible:ring-ring/30 h-9 pr-9 pl-9 transition-colors", "[&::-webkit-search-cancel-button]:hidden", className)} />

            {value && (
                <button type="button" onClick={handleClear} aria-label="Hapus pencarian" className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
