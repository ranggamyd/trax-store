import { BellIcon } from "lucide-react";

import { NotificationsPanel } from "@/app/notifications/components/NotificationsPanel";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PageContainer } from "@/components/templates/PageContainer";

export const metadata = {
    title: "Notifikasi",
};

/**
 * SERVER COMPONENT (headernya), dengan satu client island buat daftarnya.
 *
 * Header-nya dulu bespoke: div + gradient + h1 uppercase ber-glow sendiri.
 * Sekarang pakai PageHeader yang sama kayak halaman lain — jadi tinggi, jarak,
 * dan gaya judulnya konsisten tanpa perlu dijaga manual.
 */
export default function NotificationsPage() {
    return (
        <PageContainer width="narrow" innerClassName="flex flex-col gap-6">
            <PageHeader title="Notifikasi" eyebrow="Kabar masuk" subtitle="Order baru, pesan buyer, dan perubahan status — semuanya lewat sini." icon={BellIcon} />

            <NotificationsPanel />
        </PageContainer>
    );
}
