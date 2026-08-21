import { LayoutDashboard } from "lucide-react";

import { ShiftView } from "@/app/shifts/components/ShiftView";
import { getShiftViewData } from "@/app/shifts/queries";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";

export const metadata = {
    title: "Dashboard",
};

/**
 * SERVER COMPONENT.
 *
 * `refreshTick` HILANG. Versi lama nyimpen counter di sini dan nurunin
 * `onShiftEnded` / `onShiftChange` / `refreshTrigger` ke tiga komponen anak,
 * cuma supaya mereka mau nge-fetch ulang habis ada tombol diklik. Tiap komponen
 * baru harus diinget buat disambungin ke rantai itu — dan lupa satu berarti
 * ada panel yang nampilin data basi tanpa ada yang nyadar.
 *
 * Sekarang mutasi shift manggil `revalidatePath("/")` di server, jadi seluruh
 * halaman dirender ulang dengan data segar. Nol prop, nol counter.
 */
export default async function DashboardPage({ searchParams }) {
    const params = await searchParams;
    const data = await getShiftViewData(params ?? {});

    const onDuty = data.activeShift?.username;

    return (
        <PageContainer>
            <PageHeader title="Markas Besar" eyebrow="Dashboard" subtitle={onDuty ? `${onDuty} yang lagi jaga sekarang.` : "Belum ada yang jaga — order masuk belum ada yang pegang."} icon={LayoutDashboard} />

            <ShiftView data={data} basePath="/" searchParams={params ?? {}} showHistoryLink />
        </PageContainer>
    );
}
