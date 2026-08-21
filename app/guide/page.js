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
                    <p className="mb-4 text-zinc-400">Pilih salah satu extension di bawah ini sesuai kebutuhan lu. Kalo lu jalanin web ini di laptop (localhost), pakai yang DEV. Kalau udah di-deploy ke Vercel, pakai yang PROD.</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card className="border-zinc-800 bg-zinc-900/50">
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="mb-4 rounded-full bg-zinc-800 p-3 text-zinc-300">
                                    <ZapIcon className="h-8 w-8" />
                                </div>
                                <h3 className="mb-2 text-lg font-bold text-white">Versi Development (DEV)</h3>
                                <p className="mb-4 text-sm text-zinc-400">Khusus buat ngetes di localhost:3000</p>
                                <a href="/trax-sync-extension-dev.zip" download className="mt-auto flex w-full items-center justify-center gap-2 rounded-md bg-zinc-800 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700">
                                    <DownloadIcon className="h-4 w-4" /> Download ZIP
                                </a>
                            </CardContent>
                        </Card>
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="flex flex-col items-center p-6 text-center">
                                <div className="bg-primary/20 text-primary mb-4 rounded-full p-3">
                                    <ZapIcon className="h-8 w-8" />
                                </div>
                                <h3 className="mb-2 text-lg font-bold text-white">Versi Production (PROD)</h3>
                                <p className="mb-4 text-sm text-zinc-400">Khusus buat web yang udah online di Vercel</p>
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
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-6">
                            <ol className="list-decimal space-y-4 pl-4 text-zinc-300 marker:text-zinc-600">
                                <li>
                                    <strong className="text-white">Ekstrak file ZIP</strong> yang baru lu download tadi jadi satu folder.
                                </li>
                                <li>
                                    Buka Google Chrome, terus ketik <code className="text-accent rounded bg-zinc-800 px-1.5 py-0.5">chrome://extensions/</code> di URL bar.
                                </li>
                                <li>
                                    Nyalain mode <strong className="text-white">Developer mode</strong> di pojok kanan atas.
                                </li>
                                <li>
                                    Klik tombol <strong className="text-white">Load unpacked</strong> di kiri atas.
                                </li>
                                <li>
                                    Pilih folder hasil ekstrak tadi (folder yang ada file <code className="text-zinc-400">manifest.json</code> nya).
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
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-6">
                            <div className="space-y-6 text-zinc-300">
                                <div>
                                    <h3 className="mb-2 text-lg font-bold text-white">Login ke Eldorado</h3>
                                    <p>
                                        Buka tab baru, masuk ke{" "}
                                        <a href="https://www.eldorado.gg" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                            www.eldorado.gg
                                        </a>{" "}
                                        dan pastikan lu udah login pakai akun seller lu. Extension TraxStore bakal otomatis narik token lu di background secara diem-diem.
                                    </p>
                                </div>
                                <hr className="border-zinc-800" />
                                <div>
                                    <h3 className="mb-2 text-lg font-bold text-white">Kelola Orderan (Orders)</h3>
                                    <p>Masuk ke menu Orders di web ini. Kalau token lu valid, semua orderan lu bakal muncul. Lu bisa liat detail pesanan, nama Roblox buyer, link VIP server, dan klik &quot;Mark as Delivered&quot; cuma dari sini tanpa harus buka Eldorado.</p>
                                </div>
                                <hr className="border-zinc-800" />
                                <div>
                                    <h3 className="mb-2 text-lg font-bold text-white">Live Chat (Auto Balas)</h3>
                                    <p>Klik tombol Chat di tiap order buat buka Live Chat. Gunain fitur &quot;Templates&quot; buat bikin balesan otomatis. Biar buyer puas karena fast respon.</p>
                                </div>
                                <hr className="border-zinc-800" />
                                <div>
                                    <h3 className="mb-2 text-lg font-bold text-white">Gagal Tarik Data?</h3>
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
