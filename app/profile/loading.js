import { PageSkeleton } from "@/components/templates/PageSkeleton";

// Halaman profil isinya dua kartu form, bukan tabel.
export default function Loading() {
    return <PageSkeleton width="compact" withTable={false} />;
}
