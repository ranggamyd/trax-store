import { PageSkeleton } from "@/components/templates/PageSkeleton";

/**
 * Loading UI default buat semua route yang belum punya loading.js sendiri.
 *
 * Sebelumnya gak ada, jadi tiap segmen yang nunggu server nampilin layar
 * kosong — atau lebih buruk, halaman lama nyangkut sampai yang baru siap.
 *
 * Keberadaan file ini juga yang ngaktifin STREAMING: Next otomatis
 * ngebungkus segmennya pakai Suspense boundary, jadi shell (Navbar + latar)
 * bisa dikirim duluan sementara isi halamannya masih dirender.
 */
export default function Loading() {
    return <PageSkeleton />;
}
