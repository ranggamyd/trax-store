import { Clock, Timer } from "lucide-react";
import Link from "next/link";

import { Standby } from "@/components/illustrations/Standby";
import { LiveDuration } from "@/components/organisms/shift/LiveDuration";
import { ShiftActions } from "@/components/organisms/shift/ShiftActions";
import { formatDuration, getInitials } from "@/lib/utils";
import { formatWibTime } from "@/lib/wib";

/**
 * Panel "siapa yang lagi jaga". SERVER COMPONENT.
 *
 * Sebelumnya komponen ini nge-fetch sendiri lewat useAuthGuard + useEffect, dan
 * — ini bagian yang bahaya — dia GAK PUNYA `"use client"` padahal pakai hooks.
 * Dia cuma nebeng boundary dari app/page.js yang kebetulan client. Begitu
 * halamannya jadi Server Component, build-nya langsung pecah.
 *
 * Sekarang datanya dikasih dari halaman, dan cuma dua bagian yang jadi client:
 * timer yang jalan, dan tombol aksinya.
 *
 * Jam mulai diformat pakai formatWibTime, bukan toLocaleTimeString biasa —
 * tanpa timezone eksplisit, jam-nya bakal ngikutin server (UTC di Vercel) dan
 * meleset 7 jam.
 */
export function ShiftOverview({ activeShift, currentAdminId, showHistoryLink = true }) {
    return (
        <section className="glass-subtle relative overflow-hidden rounded-2xl p-6">
            <div className="from-success/[0.06] absolute inset-0 z-0 bg-gradient-to-br via-transparent to-transparent" />

            <div className="relative z-10">
                <header className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-success/10 ring-success/30 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
                            <Clock className="text-success h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">Jaga sekarang</p>
                            <h2 className="text-foreground text-lg leading-tight font-semibold tracking-tight">{activeShift ? activeShift.username : "Belum ada yang jaga"}</h2>
                        </div>
                    </div>

                    {showHistoryLink && (
                        <Link href="/shifts" className="text-success text-xs font-semibold transition-opacity hover:opacity-80">
                            Lihat riwayat
                        </Link>
                    )}
                </header>

                {activeShift ? (
                    <div className="border-success/20 bg-surface-1/60 flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center">
                        <div className="flex flex-1 items-center gap-4">
                            <div className="relative">
                                <div className="bg-success/10 ring-success/40 flex h-14 w-14 items-center justify-center rounded-full ring-2">
                                    <span className="text-success text-lg font-bold">{getInitials(activeShift.username)}</span>
                                </div>
                                <span className="border-background bg-success absolute -right-0.5 -bottom-0.5 h-4 w-4 animate-pulse rounded-full border-2" style={{ boxShadow: "0 0 8px rgb(52 211 153 / 0.8)" }} />
                            </div>
                            <div>
                                <p className="text-foreground text-lg font-semibold">{activeShift.username}</p>
                                <p className="text-muted-foreground text-xs">Mulai jam {formatWibTime(activeShift.started_at)} WIB</p>
                            </div>
                        </div>

                        <div className="border-border bg-surface-1 flex items-center gap-2 rounded-lg border px-4 py-2">
                            <Timer className="text-success h-4 w-4" />
                            <LiveDuration startedAt={activeShift.started_at} initialValue={formatDuration(activeShift.started_at)} className="text-success font-mono text-xl font-bold" />
                        </div>

                        <ShiftActions activeShift={activeShift} currentAdminId={currentAdminId} />
                    </div>
                ) : (
                    <div className="border-border bg-surface-1/40 flex flex-col items-center gap-4 rounded-xl border border-dashed p-8 text-center">
                        {/* Ikon Clock dulu di sini, dan itu ngomongin WAKTU —
                            padahal yang kosong ORANGNYA. Standby gambarnya slot
                            avatar yang bolong, jadi langsung ke intinya. */}
                        <Standby className="-mb-1 h-28 w-28" />
                        <div>
                            <p className="text-foreground text-base font-semibold">Belum ada yang jaga</p>
                            <p className="text-muted-foreground mt-1 max-w-xs text-sm">Order dan chat yang masuk sekarang gak ada yang pegang. Ambil shift biar gak numpuk.</p>
                        </div>
                        <ShiftActions activeShift={null} currentAdminId={currentAdminId} />
                    </div>
                )}
            </div>
        </section>
    );
}
