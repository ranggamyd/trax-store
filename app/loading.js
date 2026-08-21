import { PageSkeleton } from "@/components/templates/PageSkeleton";

/**
 * Loading default buat semua route yang belum punya loading.js sendiri.
 *
 * Keberadaan file ini juga yang ngaktifin STREAMING: Next otomatis ngebungkus
 * segmennya pakai Suspense boundary, jadi shell (Navbar + latar) bisa dikirim
 * duluan sementara isi halamannya masih dirender.
 */
export default function Loading() {
    return <PageSkeleton columns={5} rows={6} />;
}
