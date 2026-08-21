import { cn } from "@/lib/utils";

/**
 * Layar status seluruh halaman: error, 404, akses ditolak.
 *
 * Dibikin satu komponen karena error.js, global-error.js, dan not-found.js
 * butuh bentuk yang persis sama. Kalau tiga file itu masing-masing nulis
 * layoutnya sendiri, tiga bulan lagi ketiganya bakal keliatan beda.
 *
 * Aturan copy-nya: JUDUL bilang apa yang kejadian dalam bahasa manusia,
 * PETUNJUK bilang apa yang harus dilakuin, DETAIL teknis disimpen di balik
 * <details> supaya gak nakut-nakutin admin yang cuma butuh tombol refresh.
 */
export function StatusScreen({ illustration, code, title, hint, actions, detail, className }) {
    return (
        <div className={cn("flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-16 text-center", className)}>
            {illustration && <div className="mb-6">{illustration}</div>}

            {code && <p className="text-muted-foreground mb-2 font-mono text-[11px] font-bold tracking-[0.2em] uppercase">{code}</p>}

            <h1 className="text-foreground max-w-lg text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>

            {hint && <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">{hint}</p>}

            {actions && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>}

            {detail && (
                <details className="group mt-10 w-full max-w-lg text-left">
                    <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors select-none">Detail teknis</summary>
                    <pre className="border-border bg-surface-1/60 text-muted-foreground custom-scrollbar mt-3 max-h-40 overflow-auto rounded-xl border p-3 font-mono text-[11px] leading-relaxed">{detail}</pre>
                </details>
            )}
        </div>
    );
}
