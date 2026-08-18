"use client";

import { Clock } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/molecules/PageHeader";
import { ShiftHistoryTable } from "@/components/organisms/ShiftHistoryTable";
import { ShiftOverview } from "@/components/organisms/ShiftOverview";
import { WeeklyShiftSummary } from "@/components/organisms/WeeklyShiftSummary";
import { PageContainer } from "@/components/templates/PageContainer";

export default function ShiftsPage() {
    const [refreshTick, setRefreshTick] = useState(0);

    return (
        <PageContainer>
            <PageHeader title="Shifts" subtitle="Jam Jaga" icon={Clock} color="primary" />

            <ShiftOverview onShiftEnded={() => setRefreshTick((t) => t + 1)} onShiftChange={() => setRefreshTick((t) => t + 1)} />
            <WeeklyShiftSummary refreshTrigger={refreshTick} />
            <ShiftHistoryTable refreshTrigger={refreshTick} />
        </PageContainer>
    );
}
