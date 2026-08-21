"use client";

import { BookOpenIcon, CheckCircleIcon, DownloadIcon, LinkIcon, ZapIcon } from "lucide-react";

import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";
import { Card, CardContent } from "@/components/ui/card";

export default function GuidePage() {
    return (
        <PageContainer>
            <PageHeader title="Setup & Panduan" icon={BookOpenIcon} description="Cara install extension dan pakai TraxStore buat jualan" />

            <div className="mx-auto max-w-4xl space-y-8 pb-12">
                {/* Download Section */}
                <section>
                    <h2 className="text-primary mb-4 flex items-center gap-2 text-xl font-bold tracking-wide">
                        <DownloadIcon className="h-5 w-5" />
                        1. Download Extension
                    </h2>
                    <p className="text-muted-foreground mb-4">Pilih salah satu extension di bawah ini sesuai kebutuhan lu. Kalo lu jalanin web ini di laptop (localhost), pakai yang DEV. Kalau udah di-deploy ke Vercel, pakai yang PROD.</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card className="border-border bg-surface-2/50">
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="bg-surface-3 text-foreground/85 mb-4 rounded-full p-3">
                                    <ZapIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-foreground mb-2 text-lg font-bold">Versi Development (DEV)</h3>
                                <p className="text-muted-foreground mb-4 text-sm">Khusus buat ngetes di localhost:3000</p>
                                <a href="/trax-sync-extension-dev.zip" download className="bg-surface-3 text-foreground hover:bg-surface-3 mt-auto flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-colors">
                                    <DownloadIcon className="h-4 w-4" /> Download ZIP
                                </a>
                            </CardContent>
                        </Card>
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="bg-primary/20 text-primary mb-4 rounded-full p-3">
                                    <ZapIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-foreground mb-2 text-lg font-bold">Versi Production (PROD)</h3>
                                <p className="text-muted-foreground mb-4 text-sm">Khusus buat web yang udah online di Vercel</p>
                                <a href="/trax-sync-extension-prod.zip" download className="bg-primary hover:bg-primary/90 mt-auto flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-medium text-black transition-colors">
                                    <DownloadIcon className="h-4 w-4" /> Download ZIP
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Install Guide Section */}
                <section>
                    <h2 className="text-primary mb-4 flex items-center gap-2 text-xl font-bold tracking-wide">
                        <CheckCircleIcon className="h-5 w-5" />
                        2. Cara Install Extension di Chrome
                    </h2>
                    <Card className="border-border bg-surface-2/50">
                        <CardContent className="p-6">
                            <ol className="text-foreground/85 marker:text-muted-foreground/70 list-decimal space-y-4 pl-4">
                                <li>
                                    <strong className="text-foreground">Ekstrak file ZIP</strong> yang baru lu download tadi jadi satu folder.
                                </li>
                                <li>
                                    Buka Google Chrome, terus ketik <code className="text-accent bg-surface-3 rounded px-1.5 py-0.5">chrome://extensions/</code> di URL bar.
                                </li>
                                <li>
                                    Nyalain mode <strong className="text-foreground">Developer mode</strong> di pojok kanan atas.
                                </li>
                                <li>
                                    Klik tombol <strong className="text-foreground">Load unpacked</strong> di kiri atas.
                                </li>
                                <li>
                                    Pilih folder hasil ekstrak tadi (folder yang ada file <code className="text-muted-foreground">manifest.json</code> nya).
                                </li>
                                <li>Selesai! Pastiin logo extension-nya muncul dan aktif.</li>
                            </ol>
                        </CardContent>
                    </Card>
                </section>

                {/* Usage Guide Section */}
                <section>
                    <h2 className="text-primary mb-4 flex items-center gap-2 text-xl font-bold tracking-wide">
                        <LinkIcon className="h-5 w-5" />
                        3. Cara Pakai TraxStore
                    </h2>
                    <Card className="border-border bg-surface-2/50">
                        <CardContent className="p-6">
                            <div className="text-foreground/85 space-y-6">
                                <div>
                                    <h3 className="text-foreground mb-2 text-lg font-bold">Login ke Eldorado</h3>
                                    <p>
                                        Buka tab baru, masuk ke{" "}
                                        <a href="https://www.eldorado.gg" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                            www.eldorado.gg
                                        </a>{" "}
                                        dan pastikan lu udah login pakai akun seller lu. Extension TraxStore bakal otomatis narik token lu di background secara diem-diem.
                                    </p>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <h3 className="text-foreground mb-2 text-lg font-bold">Kelola Orderan (Orders)</h3>
                                    <p>Masuk ke menu Orders di web ini. Kalau token lu valid, semua orderan lu bakal muncul. Lu bisa liat detail pesanan, nama Roblox buyer, link VIP server, dan klik &quot;Mark as Delivered&quot; cuma dari sini tanpa harus buka Eldorado.</p>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <h3 className="text-foreground mb-2 text-lg font-bold">Live Chat (Auto Balas)</h3>
                                    <p>Klik tombol Chat di tiap order buat buka Live Chat. Gunain fitur &quot;Templates&quot; buat bikin balesan otomatis. Biar buyer puas karena fast respon.</p>
                                </div>
                                <hr className="border-border" />
                                <div>
                                    <h3 className="text-foreground mb-2 text-lg font-bold">Gagal Tarik Data?</h3>
                                    <p>Kalau tiba-tiba list order ilang atau error &quot;Token basi&quot;, coba refresh halaman web TraxStore ini. Kalau masih gak bisa, buka tab eldorado.gg lagi dan pastikan lu belom ke-logout.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PageContainer>
    );
}
