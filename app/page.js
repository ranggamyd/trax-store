"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Users, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DashboardOverview() {
    const [stats, setStats] = useState({ games: 0, accounts: 0, items: 0 });

    const { loading } = useAuthGuard(() => fetchStats());

    async function fetchStats() {
        const [gamesRes, accountsRes, itemsRes] = await Promise.all([supabase.from("games").select("*", { count: "exact", head: true }), supabase.from("accounts").select("*", { count: "exact", head: true }), supabase.from("items").select("*", { count: "exact", head: true })]);

        setStats({
            games: gamesRes.count || 0,
            accounts: accountsRes.count || 0,
            items: itemsRes.count || 0,
        });
    }

    const statCards = [
        {
            label: "Total Game",
            value: stats.games,
            icon: Gamepad2,
            color: "text-primary",
            neon: "neon-text-primary",
        },
        {
            label: "Total Master Akun",
            value: stats.accounts,
            icon: Users,
            color: "text-accent",
            neon: "neon-text-accent",
        },
        {
            label: "Total Item Terdaftar",
            value: stats.items,
            icon: Package,
            color: "text-blue-400",
            neon: "",
            style: { textShadow: "0 0 10px rgba(96,165,250,0.5)" },
        },
    ];

    return (
        <div className="text-foreground min-h-screen bg-black p-8 pb-20">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-md md:flex-row">
                    <div className="absolute inset-0 z-0 bg-[url('/cyberpunk_hero.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>

                    <div className="relative z-10 flex-1">
                        <h1 className="neon-text-primary text-4xl font-bold tracking-widest uppercase">Dashboard</h1>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">Ringkasan markas besar Traxstore saat ini. Pantau semua statistik akun, game, dan item yang terdaftar secara real-time.</p>
                    </div>

                    <div className="relative z-10 hidden h-56 w-56 shrink-0 md:block">
                        <img src="/cyberpunk_character.jpg" alt="Cyberpunk Hacker" className="h-full w-full object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]" />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.label} className="border-zinc-800 bg-zinc-950">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-bold tracking-widest text-zinc-400 uppercase">{card.label}</CardTitle>
                                    <Icon className={`h-6 w-6 ${card.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-5xl font-bold text-white ${card.neon} mt-4`} style={card.style || {}}>
                                        {loading ? <Skeleton className="h-12 w-24 bg-zinc-800" /> : card.value}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm md:flex-row">
                    <div className="h-40 w-40 shrink-0">
                        <img src="/cyberpunk_loot.jpg" alt="Cyberpunk Loot Box" className="h-full w-full object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
                    </div>
                    <div>
                        <h2 className="neon-text-accent text-xl font-bold tracking-widest text-white uppercase">Manajemen Item & Loot</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">Sistem inventaris dan item telah terhubung dengan database Traxstore. Sinkronisasi data real-time membantu melacak aset secara presisi.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
