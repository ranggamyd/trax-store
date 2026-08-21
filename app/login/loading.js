import { AuthSkeleton } from "@/components/templates/AuthSkeleton";

// Nimpa app/loading.js buat segmen ini. Tanpa file ini, navigasi ke /login
// bisa nampilin skeleton tabel sekejap — boundary root nyelimutin sini juga.
export default function Loading() {
    return <AuthSkeleton fields={2} />;
}
