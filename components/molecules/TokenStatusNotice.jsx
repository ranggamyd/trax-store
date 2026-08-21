"use client";

import { AlertTriangleIcon, ExternalLinkIcon, Loader2Icon, PuzzleIcon } from "lucide-react";

import { TOKEN_FAILURE, TOKEN_STATUS } from "@/hooks/useTokenRecovery";

/**
 * Nampilin status token Eldorado.
 * Pas lagi "recovering" tampilannya adem (lagi dijemput extension), bukan error merah.
 * Merah cuma keluar kalau emang butuh tangan user: extension belum kepasang atau belum login Eldorado.
 */
export default function TokenStatusNotice({ status, failure, retryCount = 0, className = "" }) {
    if (status === TOKEN_STATUS.RECOVERING) {
        return (
            <div className={`border-warning/40 bg-warning-muted/20 text-warning flex items-start gap-3 rounded-xl border p-4 text-sm ${className}`}>
                <Loader2Icon className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <div>
                    <p className="font-semibold">Menyiapkan token...</p>
                    <p className="mt-1 text-xs opacity-70">Pastikan Extension TraxStore sudah terinstall dan sudah melakukan login di platform Eldorado.{retryCount > 0 ? ` (${retryCount})` : ""}</p>
                </div>
            </div>
        );
    }

    if (status !== TOKEN_STATUS.FAILED) return null;

    const isNoExtension = failure === TOKEN_FAILURE.NO_EXTENSION;

    return (
        <div className={`border-danger/50 bg-danger-muted/30 text-danger rounded-xl border p-4 text-sm ${className}`}>
            <div className="flex items-start gap-3">
                {isNoExtension ? <PuzzleIcon className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />}
                <div>
                    <p className="font-semibold">{isNoExtension ? "Extension TraxStore Auto-Sync belum aktif" : "Lu belum login di Eldorado"}</p>

                    {isNoExtension ? (
                        <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs opacity-80">
                            <li>Buka chrome://extensions terus nyalain Developer mode.</li>
                            <li>Load unpacked, pilih folder trax-sync-extension-prod (atau -dev kalau lagi localhost).</li>
                            <li>Kalau udah kepasang, klik Reload di kartu extension-nya, terus refresh halaman ini.</li>
                        </ol>
                    ) : (
                        <div className="mt-2 text-xs opacity-80">
                            <a href="https://www.eldorado.gg/" target="_blank" rel="noopener noreferrer" className="text-danger hover:text-danger mt-1.5 inline-flex items-center gap-1 underline underline-offset-2">
                                Login dulu di eldorado.gg
                                <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                            <p className="mt-1.5">Abis login, halaman ini bakal pulih sendiri.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
