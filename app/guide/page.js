import { BookOpenIcon, CheckCircleIcon, DownloadIcon, LinkIcon, TriangleAlert, ZapIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
    title: "Setup & Panduan",
};

/**
 * SERVER COMPONENT.
 *
 * Halaman ini isinya teks statis — nol state, nol event, nol fetch. `"use client"`
 * di sini cuma ngirim ~15KB markup jadi JavaScript ke browser tanpa alasan.
 *
 * BUG YANG DIBENERIN: PageHeader dikasih prop `description`, padahal namanya
 * `subtitle`. React ngelewatin prop yang gak dikenal tanpa protes, jadi teks
 * "Cara install extension dan pakai TraxStore buat jualan" itu diam-diam
 * GAK PERNAH kerender.
 */

// Ditulis JSX langsung, bukan data + string surgery. Versi pertama gue nyisipin
// <strong>/<code> pakai .slice() dan .split() ke string yang sama — gampang
// meleset satu karakter, dan gak keliatan salahnya sampai kerender.
const INSTALL_STEPS = [
    <>
        <strong className="text-foreground">Ekstrak file ZIP</strong> yang baru lu download jadi satu folder.
    </>,
    <>
        Buka Chrome, ketik <code className="text-accent bg-surface-3 rounded px-1.5 py-0.5 font-mono text-xs">chrome://extensions/</code> di URL bar.
    </>,
    <>
        Nyalain <strong className="text-foreground">Developer mode</strong> di pojok kanan atas.
    </>,
    <>
        Klik <strong className="text-foreground">Load unpacked</strong> di kiri atas.
    </>,
    <>
        Pilih folder hasil ekstrak tadi — yang ada <code className="text-accent bg-surface-3 rounded px-1.5 py-0.5 font-mono text-xs">manifest.json</code> di dalamnya.
    </>,
    <>Selesai. Pastiin logo extension-nya muncul dan aktif.</>,
];

const USAGE_SECTIONS = [
    {
        title: "Login ke Eldorado",
        body: (
            <>
                Buka tab baru, masuk ke{" "}
                <a href="https://www.eldorado.gg" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    eldorado.gg
                </a>{" "}
                dan pastiin lu udah login pakai akun seller. Extension bakal narik token lu di background otomatis — gak perlu ngapa-ngapain lagi.
            </>
        ),
    },
    {
        title: "Kelola order",
        body: "Buka menu Orders. Kalau token-nya valid, semua orderan langsung nongol. Dari situ lu bisa liat detail pesanan, username Roblox buyer, link private server, dan tandain selesai — tanpa buka Eldorado sama sekali.",
    },
    {
        title: "Balesan cepat",
        body: 'Klik Chat di tiap order buat buka percakapan. Balesan yang sering dipakai simpen di menu Templates — sekali klik, kirim. Template bertipe "Specific" bahkan ngisi link private server-nya otomatis.',
    },
];

export default function GuidePage() {
    return (
        <PageContainer width="narrow">
            <PageHeader title="Setup & Panduan" eyebrow="Mulai dari sini" subtitle="Pasang extension-nya sekali, terus semua order kekelola dari satu layar." icon={BookOpenIcon} />

            <section>
                <h2 className="text-foreground mb-1.5 flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <span className="border-primary/25 bg-primary/12 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold">1</span>
                    Download extension
                </h2>
                <p className="text-muted-foreground mb-4 text-sm">Pilih sesuai tempat lu jalanin dashboard-nya. Salah versi = token-nya gak kesync.</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="glass-subtle">
                        <CardContent className="flex flex-col items-center p-6 text-center">
                            <div className="bg-surface-3 text-muted-foreground mb-4 rounded-full p-3">
                                <ZapIcon className="h-7 w-7" />
                            </div>
                            <h3 className="text-foreground mb-1 font-semibold">Versi DEV</h3>
                            <p className="text-muted-foreground mb-4 text-sm">Buat ngetes di localhost:3000</p>
                            <a href="/trax-sync-extension-dev.zip" download className="bg-surface-3 text-foreground hover:bg-surface-3/70 mt-auto flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                                <DownloadIcon className="h-4 w-4" /> Download ZIP
                            </a>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/25 bg-primary/[0.05]">
                        <CardContent className="flex flex-col items-center p-6 text-center">
                            <div className="bg-primary/15 text-primary mb-4 rounded-full p-3">
                                <ZapIcon className="h-7 w-7" />
                            </div>
                            <h3 className="text-foreground mb-1 font-semibold">Versi PROD</h3>
                            <p className="text-muted-foreground mb-4 text-sm">Buat dashboard yang udah online</p>
                            {/* text-black diganti token: --primary itu ungu, dan hitam
                                di atas ungu kontrasnya jelek. */}
                            <a href="/trax-sync-extension-prod.zip" download className="bg-primary text-primary-foreground hover:bg-primary/90 mt-auto flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                                <DownloadIcon className="h-4 w-4" /> Download ZIP
                            </a>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section>
                <h2 className="text-foreground mb-1.5 flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <span className="border-primary/25 bg-primary/12 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold">2</span>
                    Install di Chrome
                </h2>
                <p className="text-muted-foreground mb-4 text-sm">Sekali doang. Habis ini extension-nya jalan sendiri.</p>

                <Card className="glass-subtle">
                    <CardContent className="p-6">
                        <ol className="text-foreground/85 marker:text-muted-foreground/70 list-decimal space-y-3 pl-4 text-sm">
                            {INSTALL_STEPS.map((step, index) => (
                                // Index aman jadi key di sini: daftarnya konstan, gak pernah
                                // diurut ulang, gak pernah disisipin di tengah.
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            </section>

            <section>
                <h2 className="text-foreground mb-1.5 flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <span className="border-primary/25 bg-primary/12 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold">3</span>
                    Cara pakai
                </h2>
                <p className="text-muted-foreground mb-4 text-sm">Tiga hal yang bakal lu pakai tiap hari.</p>

                <Card className="glass-subtle">
                    <CardContent className="divide-border divide-y p-0">
                        {USAGE_SECTIONS.map((section) => (
                            <div key={section.title} className="p-6">
                                <h3 className="text-foreground mb-1.5 font-semibold">{section.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{section.body}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section>
                <h2 className="text-foreground mb-1.5 flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <TriangleAlert className="text-warning h-5 w-5 shrink-0" />
                    Kalau order-nya ilang
                </h2>
                <Card className="border-warning/25 bg-warning/[0.05]">
                    <CardContent className="p-6">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Hampir selalu cuma token yang basi. Urutannya: <strong className="text-foreground">refresh dashboard ini</strong> dulu. Kalau masih kosong, buka tab eldorado.gg dan pastiin lu belum ke-logout. Extension-nya bakal narik token baru sendiri dalam beberapa detik.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Link href="/orders" className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 pt-2 text-xs transition-colors">
                <CheckCircleIcon className="text-success h-3.5 w-3.5" />
                Semua siap? Langsung ke Orders.
                <LinkIcon className="h-3 w-3" />
            </Link>
        </PageContainer>
    );
}
