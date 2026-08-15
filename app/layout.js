import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Navbar } from "@/components/Navbar";
import { CursorTrail } from "@/components/CursorTrail";
import NextTopLoader from "nextjs-toploader";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Markas Besar Traxstore",
    description: "Internal Dashboard for Traxstore Admins",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
            <body className="bg-background text-foreground selection:bg-primary/30 flex min-h-full flex-col">
                <CursorTrail />
                <NextTopLoader color="#60a5fa" showSpinner={false} />
                <Navbar />
                {children}
                <GlobalSearch />
                <Toaster theme="dark" position="bottom-right" />
            </body>
        </html>
    );
}
