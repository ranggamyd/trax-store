import { PageSkeleton } from "@/components/templates/PageSkeleton";

// 4 kolom biar bentuknya sama kayak tabel akun yang bakal nongol.
export default function Loading() {
    return <PageSkeleton columns={4} rows={8} />;
}
