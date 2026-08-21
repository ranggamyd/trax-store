import { PageSkeleton } from "@/components/templates/PageSkeleton";

// Halaman template pakai grid kartu, bukan tabel — jadi skeleton tabelnya dimatiin.
export default function Loading() {
    return <PageSkeleton withTable={false} />;
}
