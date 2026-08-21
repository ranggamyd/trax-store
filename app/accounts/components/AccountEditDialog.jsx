"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AccountFormDialog } from "@/app/accounts/components/AccountFormDialog";

/**
 * Nyetir dialog edit dari URL (?edit=<id>).
 *
 * Kenapa state dialog ditaro di URL, bukan di useState:
 *
 *   1. SATU instance dialog per halaman, bukan satu per baris. Kalau tiap baris
 *      punya dialog + react-hook-form sendiri, 20 baris berarti 20 form yang
 *      dibikin cuma buat nunggu diklik.
 *
 *   2. Data pre-fill-nya dateng dari SERVER. page.js yang query akunnya
 *      berdasarkan ?edit, jadi form-nya kebuka udah terisi — gak ada kedipan
 *      "form kosong dulu, baru keisi".
 *
 *   3. Bisa di-share. "Bantuin cek akun ini" cukup kirim URL-nya.
 *
 *   4. Tombol back nutup dialog, sesuai kebiasaan orang di HP.
 */
export function AccountEditDialog({ account }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const close = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("edit");

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return <AccountFormDialog account={account} open={Boolean(account)} onOpenChange={(next) => !next && close()} />;
}
