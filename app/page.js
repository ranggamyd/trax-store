import { Clock, Gamepad2, MessageSquare, Users } from "lucide-react";

import { StatCard } from "@/app/components/StatCard";
import { ShiftView } from "@/app/shifts/components/ShiftView";
import { getShiftViewData } from "@/app/shifts/queries";
import { Meteors } from "@/components/aceternity/Meteors";
import { PageContainer } from "@/components/templates/PageContainer";
import { getDashboardStats } from "@/lib/dashboardStats";

export const metadata = {
    title: "Dashboard",
};

/**
 * SERVER COMPONENT.
 *
 * `refreshTick` HILANG. Versi lama nyimpen counter di sini dan nurunin
 * `onShiftEnded` / `onShiftChange` / `refreshTrigger` ke tiga komponen anak,
 * cuma supaya mereka mau nge-fetch ulang habis ada tombol diklik. Sekarang
 * mutasi shift manggil `revalidatePath("/")` di server. Nol prop, nol counter.
 *
 * Meteors dipakai SEKALI, cuma di kartu hero ini. Kalau ditempel di semua
 * kartu, dia berhenti jadi aksen dan mulai jadi gangguan.
 */
export default async function DashboardPage({ searchParams }) {
    const params = await searchParams;

    const [data, stats] = await Promise.all([getShiftViewData(params ?? {}), getDashboardStats()]);

    const onDuty = data.activeShift?.username;
    const weeklyHours = Math.round((data.weekly.summary ?? []).reduce((total, row) => total + row.total_minutes, 0) / 60);

    return (
        <PageContainer>
            {/* ── Hero ────────────────────────────────────────────────────── */}
            <section className="glass relative overflow-hidden rounded-2xl p-6 md:p-8">
                <Meteors count={12} />

                <div className="relative">
                    <p className="text-muted-foreground text-[10px] font-bold tracking-[0.22em] uppercase">Markas Besar</p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                        {onDuty ? (
                            <>
                                <span className="text-brand">{onDuty}</span> <span className="text-foreground">yang jaga sekarang</span>
                            </>
                        ) : (
                            <span className="text-foreground">Belum ada yang jaga</span>
                        )}
                    </h1>

                    {/* Subtitle-nya nyebut KONSEKUENSI, bukan cuma keadaan.
                        "Belum ada yang jaga" itu fakta; "order yang masuk gak ada
                        yang pegang" itu alasan buat bertindak. */}
                    <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">{onDuty ? "Order dan chat yang masuk udah ada yang pegang. Cek rekap jam di bawah kalau mau lihat siapa jaga kapan." : "Order dan chat yang masuk sekarang gak ada yang pegang. Ambil shift di bawah biar gak ada yang kelewat."}</p>
                </div>
            </section>

            {/* ── Statistik ───────────────────────────────────────────────── */}
            {stats && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Akun siap pakai" value={stats.readyAccounts} hint={stats.outOfRobux > 0 ? `${stats.outOfRobux} akun lagi habis robux` : "Semua akun robux-nya ada"} icon={Users} href="/accounts" tone={stats.readyAccounts === 0 ? "warning" : "success"} />

                    <StatCard label="Game ketaut" value={stats.totalGames} hint="Punya akun & link private server" icon={Gamepad2} href="/games" tone="accent" />

                    <StatCard label="Template balesan" value={stats.totalTemplates} hint="Sekali klik, kirim ke buyer" icon={MessageSquare} href="/templates" tone="primary" />

                    <StatCard label="Jam minggu ini" value={weeklyHours} suffix=" jam" hint="Sabtu sampai Jumat, semua admin" icon={Clock} href="/shifts" tone="warning" />
                </div>
            )}

            <ShiftView data={data} basePath="/" searchParams={params ?? {}} showHistoryLink />
        </PageContainer>
    );
}
