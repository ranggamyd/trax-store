"use client";

import { useState } from "react";

import { ShiftHistoryTable } from "@/components/organisms/ShiftHistoryTable";
import { ShiftOverview } from "@/components/organisms/ShiftOverview";
import { WeeklyShiftSummary } from "@/components/organisms/WeeklyShiftSummary";

export default function DashboardOverview() {
    const [refreshTick, setRefreshTick] = useState(0);

    return (
        <div className="text-foreground min-h-screen bg-black p-8 pb-20">
            <div className="mx-auto max-w-6xl space-y-8">
                <ShiftOverview 
                    onShiftEnded={() => setRefreshTick((t) => t + 1)} 
                    onShiftChange={() => setRefreshTick((t) => t + 1)} 
                />
                <WeeklyShiftSummary refreshTrigger={refreshTick} />
                <ShiftHistoryTable refreshTrigger={refreshTick} />
            </div>
        </div>
    );
}
