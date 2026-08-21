import { Clock } from "lucide-react";

import { ShiftView } from "@/app/shifts/components/ShiftView";
import { getShiftViewData } from "@/app/shifts/queries";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";

export const metadata = {
    title: "Shift",
};

/** SERVER COMPONENT. Sama kayak dashboard, tapi tanpa link "lihat riwayat". */
export default async function ShiftsPage({ searchParams }) {
    const params = await searchParams;
    const data = await getShiftViewData(params ?? {});

    return (
        <PageContainer>
            <PageHeader title="Shift" eyebrow="Jam jaga" subtitle={data.historyTotal > 0 ? `${data.historyTotal} shift kecatat di periode yang dipilih.` : "Siapa jaga kapan, dan berapa jam."} icon={Clock} />

            <ShiftView data={data} basePath="/shifts" searchParams={params ?? {}} showHistoryLink={false} />
        </PageContainer>
    );
}
