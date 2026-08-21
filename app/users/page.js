import { Shield, UserRound } from "lucide-react";

import { UserEditDialog } from "@/app/users/components/UserEditDialog";
import { UserRowActions } from "@/app/users/components/UserRowActions";
import { UsersToolbar } from "@/app/users/components/UsersToolbar";
import { getAdminById, listAdmins } from "@/app/users/queries";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Pagination } from "@/components/molecules/Pagination";
import { DataTable } from "@/components/organisms/DataTable";
import { PageContainer } from "@/components/templates/PageContainer";
import { TableCell } from "@/components/ui/table";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata = {
    title: "Admin",
};

const COLUMNS = [{ label: "Admin" }, { label: "Status" }, { label: "Gabung" }, { label: "Aksi", className: "text-right" }];

const DATE_FORMAT = { year: "numeric", month: "short", day: "numeric" };

/** SERVER COMPONENT — pola yang sama kayak /accounts. */
export default async function UsersPage({ searchParams }) {
    const params = await searchParams;

    const query = typeof params?.q === "string" ? params.q : "";
    const requestedPage = Number.parseInt(params?.page ?? "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const editId = typeof params?.edit === "string" ? params.edit : null;

    const [{ users, total, pageCount, pageSize, error }, editingUser, currentAdmin] = await Promise.all([listAdmins({ query, page }), getAdminById(editId), getCurrentAdmin()]);

    const isSearching = query.length > 0;

    return (
        <PageContainer>
            <PageHeader title="Admin" subtitle={total > 0 ? `${total} orang punya akses ke markas ini.` : "Siapa aja yang boleh masuk."} eyebrow="Akses" icon={Shield} rightContent={<UsersToolbar />} />

            {error && (
                <div className="border-danger/25 bg-danger/[0.07] text-danger rounded-2xl border p-4 text-sm" role="alert">
                    Gagal ngambil daftar admin: {error}
                </div>
            )}

            <DataTable
                columns={COLUMNS}
                data={users}
                emptyTitle={isSearching ? `Gak ada admin yang cocok sama "${query}"` : "Belum ada admin lain"}
                emptyHint={isSearching ? "Coba cari pakai username atau email-nya langsung." : 'Klik "Tambah admin" buat ngasih akses ke anggota tim.'}
                footer={<Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} />}
                renderRow={(user) => {
                    const isSelf = user.id === currentAdmin?.id;

                    return (
                        <ClickableTableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-start gap-3">
                                    <div className="border-border bg-surface-3 text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
                                        <UserRound className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground truncate font-medium">{user.username}</span>
                                            {isSelf && (
                                                <StatusBadge variant="primary" withDot={false}>
                                                    Lu
                                                </StatusBadge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">{user.primary_email}</p>
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell>{user.has_profile ? <StatusBadge variant="success">Aktif</StatusBadge> : <StatusBadge variant="warning">Profil kosong</StatusBadge>}</TableCell>

                            <TableCell className="text-muted-foreground text-sm">{new Date(user.created_at).toLocaleDateString("id-ID", DATE_FORMAT)}</TableCell>

                            <TableCell className="text-right">
                                <UserRowActions user={user} isSelf={isSelf} />
                            </TableCell>
                        </ClickableTableRow>
                    );
                }}
            />

            <UserEditDialog user={editingUser} />
        </PageContainer>
    );
}
