"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getShiftHistory, getShiftUsers } from "@/app/actions/shifts";
import { DataTable } from "@/components/organisms/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDurationText, getDefaultDateRange } from "@/lib/utils";

const PAGE_SIZE = 20;

export function ShiftHistoryTable({ refreshTrigger }) {
    const [history, setHistory] = useState([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyPage, setHistoryPage] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [filterUserId, setFilterUserId] = useState("");
    const [filterStartDate, setFilterStartDate] = useState(getDefaultDateRange().startDate);
    const [filterEndDate, setFilterEndDate] = useState(getDefaultDateRange().endDate);

    const [shiftUsers, setShiftUsers] = useState([]);

    const fetchUsers = useCallback(async () => {
        const usersRes = await getShiftUsers();
        if (usersRes.users) setShiftUsers(usersRes.users);
    }, []);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        const res = await getShiftHistory({
            startDate: filterStartDate,
            endDate: filterEndDate,
            userId: filterUserId || undefined,
            page: historyPage,
            pageSize: PAGE_SIZE,
        });
        if (res.error) {
            // toast.error(res.error);
        } else {
            setHistory(res.shifts || []);
            setHistoryTotal(res.total || 0);
        }
        setHistoryLoading(false);
    }, [filterStartDate, filterEndDate, filterUserId, historyPage]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data, loading flag-nya sengaja di-set biar spinner langsung nongol
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchHistory();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [fetchHistory, refreshTrigger]);

    const totalPages = Math.ceil(historyTotal / PAGE_SIZE);

    return (
        <div className="mt-8">
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-zinc-500">Dari Tanggal</Label>
                    <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => {
                            setFilterStartDate(e.target.value);
                            setHistoryPage(0);
                        }}
                        className="border-zinc-800 bg-zinc-900 text-white"
                    />
                </div>
                <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-zinc-500">Sampe Tanggal</Label>
                    <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => {
                            setFilterEndDate(e.target.value);
                            setHistoryPage(0);
                        }}
                        className="border-zinc-800 bg-zinc-900 text-white"
                    />
                </div>
                <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-zinc-500">Admin</Label>
                    <select
                        value={filterUserId}
                        onChange={(e) => {
                            setFilterUserId(e.target.value);
                            setHistoryPage(0);
                        }}
                        className="focus:ring-primary/50 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:ring-1"
                    >
                        <option value="">Semua</option>
                        {shiftUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.username}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <div className="mb-4 flex items-center gap-3">
                    <div className="bg-primary/10 ring-primary/30 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
                        <Calendar className="text-primary h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-primary text-glow-primary text-sm font-bold tracking-widest uppercase">History</h3>
                        <p className="text-xs text-zinc-600">Rekap jam jaga</p>
                    </div>
                </div>

                <DataTable
                    loading={historyLoading}
                    data={history}
                    emptyMessage="Belum ada history shift di periode ini."
                    columns={[{ label: "Admin" }, { label: "Tanggal" }, { label: "Mulai" }, { label: "Selesai" }, { label: "Durasi" }]}
                    renderRow={(shift) => {
                        const username = shift.admin_profiles?.username || "Unknown";
                        const startTime = new Date(shift.started_at);
                        const endTime = new Date(shift.ended_at);
                        const duration = formatDurationText(shift.started_at, shift.ended_at);
                        return (
                            <TableRow key={shift.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableCell className="font-medium text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">{username.charAt(0).toUpperCase()}</div>
                                        {username}
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-400">
                                    {startTime.toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-zinc-300">{startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                                <TableCell className="font-mono text-sm text-zinc-300">{endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm font-bold text-green-400">{duration}</span>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />

                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-zinc-500">
                            Menampilkan {historyPage * PAGE_SIZE + 1}–{Math.min((historyPage + 1) * PAGE_SIZE, historyTotal)} dari {historyTotal} shift
                        </p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white" onClick={() => setHistoryPage((p) => Math.max(0, p - 1))} disabled={historyPage === 0}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="flex items-center px-3 text-xs font-bold text-zinc-400">
                                {historyPage + 1} / {totalPages}
                            </span>
                            <Button variant="ghost" size="sm" className="border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white" onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))} disabled={historyPage >= totalPages - 1}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
