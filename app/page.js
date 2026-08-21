"use client";

import { useState } from "react";

import { ShiftHistoryTable } from "@/components/organisms/ShiftHistoryTable";
import { ShiftOverview } from "@/components/organisms/ShiftOverview";
import { WeeklyShiftSummary } from "@/components/organisms/WeeklyShiftSummary";
import { PageContainer } from "@/components/templates/PageContainer";

export default function DashboardOverview() {
    // Counter ini masih prop-drilling buat maksa anak refetch. Diganti
    // revalidatePath waktu halaman ini di-RSC-in di Fase 3 — dicatat, bukan dilupain.
    const [refreshTick, setRefreshTick] = useState(0);
    const bumpRefresh = () => setRefreshTick((t) => t + 1);

    return (
        <PageContainer>
            <ShiftOverview onShiftEnded={bumpRefresh} onShiftChange={bumpRefresh} />
            <WeeklyShiftSummary refreshTrigger={refreshTick} />
            <ShiftHistoryTable refreshTrigger={refreshTick} />
        </PageContainer>
    );
}
