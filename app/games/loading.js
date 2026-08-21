import { PageSkeleton } from "@/components/templates/PageSkeleton";

// Grid kartu, bukan tabel.
export default function Loading() {
    return <PageSkeleton width="wide" withTable={false} />;
}
