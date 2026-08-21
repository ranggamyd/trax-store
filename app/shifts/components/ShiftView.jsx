import { ShiftHistoryTable } from "@/components/organisms/ShiftHistoryTable";
import { ShiftOverview } from "@/components/organisms/ShiftOverview";
import { WeeklyShiftSummary } from "@/components/organisms/WeeklyShiftSummary";

/**
 * Susunan tampilan shift, dipakai bareng dashboard (/) dan /shifts.
 *
 * SERVER COMPONENT. Dibikin satu supaya dua halaman itu gak drift — sebelumnya
 * keduanya nyalin susunan tiga komponen + prop `refreshTick` yang sama, dan
 * tiap perubahan harus diinget dilakuin dua kali.
 *
 * `basePath` dipakai buat nyusun link navigasi minggu, jadi klik "minggu lalu"
 * di dashboard tetep di dashboard, dan di /shifts tetep di /shifts.
 */
export function ShiftView({ data, basePath, searchParams, showHistoryLink }) {
    return (
        <>
            {data.activeShiftError && (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-2xl border p-4 text-sm" role="alert">
                    Gagal baca shift aktif: {data.activeShiftError}
                </div>
            )}

            <ShiftOverview activeShift={data.activeShift} currentAdminId={data.currentAdminId} showHistoryLink={showHistoryLink} />

            <WeeklyShiftSummary summary={data.weekly.summary} periodStart={data.weekly.periodStart} periodEnd={data.weekly.periodEnd} error={data.weekly.error} weekOffset={data.weekOffset} basePath={basePath} searchParams={searchParams} />

            <ShiftHistoryTable shifts={data.history} total={data.historyTotal} page={data.historyPage} pageCount={data.historyPageCount} pageSize={data.historyPageSize} admins={data.admins} filters={data.filters} defaults={data.defaults} error={data.historyError} />
        </>
    );
}
