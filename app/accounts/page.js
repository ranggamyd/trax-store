import { User } from "lucide-react";

import { AccountEditDialog } from "@/app/accounts/components/AccountEditDialog";
import { AccountRowActions } from "@/app/accounts/components/AccountRowActions";
import { AccountsToolbar } from "@/app/accounts/components/AccountsToolbar";
import { getAccountById, getAccounts } from "@/app/accounts/queries";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Pagination } from "@/components/molecules/Pagination";
import { DataTable } from "@/components/organisms/DataTable";
import { PageContainer } from "@/components/templates/PageContainer";
import { TableCell } from "@/components/ui/table";
import { getInitials } from "@/lib/utils";

export const metadata = {
    title: "Akun Roblox",
};

const COLUMNS = [{ label: "Akun" }, { label: "Catatan" }, { label: "Robux", className: "text-center" }, { label: "Aksi", className: "text-right" }];

/**
 * SERVER COMPONENT.
 *
 * Yang berubah dari versi "use client" sebelumnya:
 *
 *   SEBELUM: browser unduh JS -> hydrate -> getSession() -> select("*") ->
 *            simpen semua baris di state -> filter di render.
 *            Empat perjalanan bolak-balik sebelum baris pertama kelihatan.
 *
 *   SEKARANG: server query persis satu halaman data (udah kefilter, udah
 *             ke-paginasi) dan ngirim HTML-nya. Nol fetch dari klien, nol
 *             useEffect, nol useAuthGuard — identitas user udah dipastiin
 *             di proxy.js sebelum halaman ini kesentuh.
 *
 * Yang tersisa jadi client component cuma tiga pulau kecil: toolbar (input
 * pencarian), aksi per baris (tombol), dan dialog. Sisanya HTML dari server.
 */
export default async function AccountsPage({ searchParams }) {
    // Di Next 16 searchParams itu Promise — harus di-await.
    const params = await searchParams;

    const query = typeof params?.q === "string" ? params.q : "";
    const requestedPage = Number.parseInt(params?.page ?? "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const editId = typeof params?.edit === "string" ? params.edit : null;

    // Query paralel: daftar akun dan akun yang lagi diedit gak saling nunggu.
    const [{ accounts, total, pageCount, pageSize, error }, editingAccount] = await Promise.all([getAccounts({ query, page }), getAccountById(editId)]);

    const isSearching = query.length > 0;

    return (
        <PageContainer>
            <PageHeader title="Akun Roblox" subtitle={total > 0 ? `${total} akun kesimpen di stok internal.` : "Stok akun internal Traxstore."} eyebrow="Inventaris" icon={User} color="accent" rightContent={<AccountsToolbar />} />

            {error && (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-2xl border p-4 text-sm" role="alert">
                    Gagal ngambil data akun: {error}
                </div>
            )}

            <DataTable
                columns={COLUMNS}
                data={accounts}
                emptyTitle={isSearching ? `Gak ada yang cocok sama "${query}"` : "Stok akun masih kosong"}
                emptyHint={isSearching ? "Coba kata kunci yang lebih pendek, atau cek ejaan username-nya." : 'Klik "Tambah akun" di kanan atas buat masukin username Roblox pertama.'}
                footer={<Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} />}
                renderRow={(account) => (
                    <ClickableTableRow key={account.id} href={`/accounts/${account.id}`}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <div className="border-border bg-surface-3 text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold">{getInitials(account.username)}</div>
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="truncate">{account.username}</span>
                                    <CopyButton textToCopy={account.username} className="h-6 w-6 shrink-0" />
                                </div>
                            </div>
                        </TableCell>

                        <TableCell className="max-w-xs">
                            <span className="text-muted-foreground block truncate text-sm">{account.notes || "—"}</span>
                        </TableCell>

                        <TableCell className="text-center">{account.status === "EMPTY_ROBUX" ? <StatusBadge variant="danger">Habis</StatusBadge> : <StatusBadge variant="success">Tersedia</StatusBadge>}</TableCell>

                        <TableCell className="text-right">
                            <AccountRowActions account={account} />
                        </TableCell>
                    </ClickableTableRow>
                )}
            />

            {/* Dialog edit dinyetir ?edit=<id>, dan datanya udah di-prefetch di server */}
            <AccountEditDialog account={editingAccount} />
        </PageContainer>
    );
}
