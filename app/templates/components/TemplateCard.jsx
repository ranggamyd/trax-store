import { Gamepad2, TriangleAlert, UserRound } from "lucide-react";

import { TemplateCardActions } from "@/app/templates/components/TemplateCardActions";
import { CardSpotlight } from "@/components/aceternity/CardSpotlight";
import { StatusBadge } from "@/components/atoms/StatusBadge";

/**
 * Kartu template. SERVER COMPONENT — cuma tombol aksinya yang client.
 *
 * Nama & ikon game udah kelar di server (lihat queries.js), jadi gak ada lagi
 * kedipan "Game kehapus" waktu Eldorado library masih dijemput di browser.
 *
 * CardSpotlight (Aceternity) dipakai sebagai PEMBUNGKUS. Ini yang bikin dia
 * murah: pembungkusnya client component ~40 baris, tapi seluruh isi kartunya —
 * judul, badge, teks template, daftar trigger — tetep HTML dari server. React
 * ngizinin client component nerima children yang udah dirender server, jadi
 * efek hover-nya dapet tanpa nyeret isinya ke bundle browser.
 */
export function TemplateCard({ template, game, account }) {
    const isSpecific = template.type === "Specific";
    const triggers = template.triggers ?? [];

    return (
        <CardSpotlight as="article" radius={260} color={isSpecific ? "var(--primary)" : "var(--accent)"} className="flex flex-col p-5">
            <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-foreground truncate text-base font-semibold">{template.title}</h3>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">urutan #{template.sort_order || 0}</p>
                </div>

                <StatusBadge variant={isSpecific ? "primary" : "info"} withDot={false}>
                    {template.type}
                </StatusBadge>
            </header>

            {isSpecific && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold">
                        {game?.icon_url ? <img src={game.icon_url} alt="" className="h-3 w-3 rounded-sm object-cover" /> : <Gamepad2 className="h-3 w-3" />}
                        {game?.name || "Game kehapus"}
                    </span>

                    <span className="border-border bg-surface-3/60 text-foreground/80 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]">
                        <UserRound className="h-3 w-3" />
                        {account?.username || "Akun dipilih saat kirim"}
                    </span>

                    {account && !account.private_server_link && (
                        <span className="border-warning/25 bg-warning/10 text-warning inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold">
                            <TriangleAlert className="h-3 w-3" />
                            Link kosong
                        </span>
                    )}
                </div>
            )}

            <p className="text-muted-foreground mb-4 flex-1 text-sm whitespace-pre-line">{template.text}</p>

            <footer className="border-border/70 flex items-end justify-between gap-3 border-t pt-4">
                <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground mb-1.5 text-[10px] font-bold tracking-wider uppercase">Trigger</p>
                    <div className="flex flex-wrap gap-1">
                        {triggers.length > 0 ? (
                            triggers.map((t) => (
                                <span key={t} className="bg-surface-3 text-foreground/80 rounded px-1.5 py-0.5 text-[10px]">
                                    {t}
                                </span>
                            ))
                        ) : (
                            <span className="text-muted-foreground text-xs">Manual aja</span>
                        )}
                    </div>
                </div>

                <TemplateCardActions template={template} />
            </footer>
        </CardSpotlight>
    );
}
