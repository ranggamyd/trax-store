import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { AmbientBackground } from "@/components/AmbientBackground";
import { PageTransition } from "@/components/motion/PageTransition";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { EldoradoLibraryProvider } from "@/contexts/EldoradoLibraryContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata = {
    title: {
        default: "Markas Besar Traxstore",
        // Tiap halaman cukup kasih judul pendek, sisanya nyusul otomatis.
        template: "%s · Traxstore",
    },
    description: "Pusat kendali operasional Traxstore. Order, offer, stok akun, dan shift — satu layar.",
    // Dashboard internal. Jangan pernah keindeks.
    robots: { index: false, follow: false, nocache: true },
};

export const viewport = {
    themeColor: "#07070b",
    colorScheme: "dark",
};

export default function RootLayout({ children }) {
    return (
        <html lang="id" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
            <body className="bg-background text-foreground selection:bg-primary/30 selection:text-foreground flex min-h-full flex-col">
                {/* Latar ambient: server component, nol JS. Gantiin CursorTrail. */}
                <AmbientBackground />

                <NextTopLoader color="#7c5cff" height={2} showSpinner={false} shadow="0 0 12px #7c5cff" />

                <EldoradoLibraryProvider>
                    <Navbar />
                    <PageTransition>{children}</PageTransition>
                </EldoradoLibraryProvider>

                <Toaster position="bottom-right" />
            </body>
        </html>
    );
}
