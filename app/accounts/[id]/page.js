import { ArrowLeft, Gamepad2, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountHeaderActions } from "@/app/accounts/[id]/components/AccountHeaderActions";
import { DetailToolbar } from "@/app/accounts/[id]/components/DetailToolbar";
import { GameRowActions } from "@/app/accounts/[id]/components/GameRowActions";
import { ItemRowActions } from "@/app/accounts/[id]/components/ItemRowActions";
import { getAccountDetail } from "@/app/accounts/[id]/queries";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { BrokenLink } from "@/components/illustrations/BrokenLink";
import { EmptyRadar } from "@/components/illustrations/EmptyRadar";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { PrivateServerLinkCell } from "@/components/molecules/PrivateServerLinkCell";
import { DataTable } from "@/components/organisms/DataTable";
import { PageContainer } from "@/components/templates/PageContainer";
import { TableCell, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import { formatWibDate } from "@/lib/wib";

const GAME_COLUMNS = [{ label: "Game" }, { label: "Private server" }, { label: "Ditautkan", className: "text-right" }, { label: "Aksi", className: "text-right" }];

const ITEM_COLUMNS = [{ label: "Item" }, { label: "Game" }, { label: "Stok" }, { label: "Catatan" }, { label: "Aksi", className: "text-right" }];

export async function generateMetadata({ params }) {
    const { id } = await params;
    const detail = await getAccountDetail(id);

    return { title: detail?.account?.username ?? "Akun" };
}

/**
 * SERVER COMPONENT.
 *
 * Tab-nya dinyetir URL (?tab=items), bukan komponen Tabs. Alasannya bukan gaya:
 * `Tabs` itu client component, jadi kalau tabelnya ditaro di dalamnya seluruh
 * isi halaman kebawa ke bundle browser. Dengan tab lewat <Link>, kedua tabel
 * tetep HTML dari server — dan tab yang kebuka jadi bisa di-bookmark.
 */
export default async function AccountDetailPage({ params, searchParams }) {
    const { id } = await params;
    const query = await searchParams;

    const detail = await getAccountDetail(id);
    if (!detail) notFound();

    const { account, linkedGames, linkedItems, allGames } = detail;

    const tab = query?.tab === "items" ? "items" : "games";
    const search = (typeof query?.q === "string" ? query.q : "").trim().toLowerCase();

    const games = search ? linkedGames.filter((row) => (row.games?.name ?? "").toLowerCase().includes(search)) : linkedGames;
    const items = search ? linkedItems.filter((row) => (row.items?.item_name ?? "").toLowerCase().includes(search)) : linkedItems;

    const hasRobux = account.status === "ACTIVE";

    const tabHref = (nextTab) => {
        // `q` sengaja dibuang waktu ganti tab: kata kunci game gak ada artinya
        // di daftar item, dan yang lama malah bikin tab tujuan kelihatan kosong.
        const next = new URLSearchParams();
        if (nextTab === "items") next.set("tab", "items");
        const qs = next.toString();
        return qs ? `/accounts/${id}?${qs}` : `/accounts/${id}`;
    };

    return (
        <PageContainer>
            {/* Header ditulis di sini, bukan pakai DetailHeader — DetailHeader itu
                client component (dia pakai router.back()), dan nariknya ke sini
                bakal bikin seluruh header kebawa ke bundle browser. */}
            <header className="glass flex flex-col justify-between gap-4 rounded-2xl p-5 md:flex-row md:items-center md:p-6">
                <div className="flex min-w-0 items-center gap-4">
                    <Link href="/accounts" aria-label="Balik ke daftar akun" className="text-muted-foreground hover:text-foreground hover:bg-surface-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    <div className="border-border bg-surface-3 text-muted-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-lg font-bold">{getInitials(account.username)}</div>

                    <div className="min-w-0">
                        <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">Akun Roblox</p>
                        <h1 className="text-foreground flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <span className="truncate">{account.username}</span>
                            <CopyButton textToCopy={account.username} className="h-6 w-6 shrink-0" />
                        </h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {hasRobux ? <StatusBadge variant="success">Robux tersedia</StatusBadge> : <StatusBadge variant="danger">Robux habis</StatusBadge>}
                            {account.notes && <span className="text-muted-foreground truncate text-xs">{account.notes}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                    <AccountHeaderActions account={account} />
                </div>
            </header>

            {/* Tab: dua <Link>, jadi bisa dibuka di tab baru dan bisa di-prefetch */}
            <nav className="border-border bg-surface-1/60 mx-auto grid w-full max-w-md grid-cols-2 gap-1 rounded-xl border p-1">
                <Link href={tabHref("games")} scroll={false} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === "games" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Gamepad2 className="h-4 w-4" />
                    Game
                    <span className="text-muted-foreground text-xs">({linkedGames.length})</span>
                </Link>
                <Link href={tabHref("items")} scroll={false} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === "items" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                    <Package className="h-4 w-4" />
                    Item
                    <span className="text-muted-foreground text-xs">({linkedItems.length})</span>
                </Link>
            </nav>

            <DetailToolbar accountId={id} allGames={allGames} tab={tab} />

            {tab === "games" ? (
                <DataTable
                    columns={GAME_COLUMNS}
                    data={games}
                    emptyIllustration={search ? <EmptyRadar className="mb-2 h-32 w-32 opacity-90" /> : <BrokenLink className="mb-2 h-32 w-32 opacity-90" />}
                    emptyTitle={search ? `Gak ada game yang cocok sama "${search}"` : "Akun ini belum ditautin ke game mana pun"}
                    emptyHint={search ? "Coba kata kunci yang lebih pendek." : 'Klik "Tautin game" buat nyambungin akun ini ke game.'}
                    renderRow={(row) => (
                        <ClickableTableRow key={row.id} href={`/games/${row.games?.id}`}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    {row.games?.image_url ? <span className="bg-surface-3 h-8 w-8 shrink-0 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${row.games.image_url})` }} /> : <span className="bg-surface-3 text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold">{getInitials(row.games?.name)}</span>}
                                    <span className="text-foreground truncate">{row.games?.name ?? "(game kehapus)"}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <PrivateServerLinkCell link={row.private_server_link} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-right text-sm">{formatWibDate(row.created_at)}</TableCell>
                            <TableCell className="text-right">
                                <GameRowActions accountId={id} accountUsername={account.username} accountGame={row} />
                            </TableCell>
                        </ClickableTableRow>
                    )}
                />
            ) : (
                <DataTable
                    columns={ITEM_COLUMNS}
                    data={items}
                    emptyIllustration={search ? <EmptyRadar className="mb-2 h-32 w-32 opacity-90" /> : <BrokenLink className="mb-2 h-32 w-32 opacity-90" />}
                    emptyTitle={search ? `Gak ada item yang cocok sama "${search}"` : "Akun ini belum punya item kecatat"}
                    emptyHint={search ? "Coba cari pakai potongan namanya." : 'Klik "Tautin item" buat nandain item yang ada di akun ini.'}
                    renderRow={(row) => (
                        // Barisnya sengaja GAK clickable. Versi lama link ke /items/<id>,
                        // padahal halaman /items udah dihapus dari project — jadi tiap
                        // klik baris item mendarat di 404.
                        <TableRow key={row.id} className="border-border hover:bg-surface-2/60">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <span className="border-border bg-surface-3 text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold">{getInitials(row.items?.item_name || "I")}</span>
                                    <span className="text-foreground truncate">{row.items?.item_name ?? "(item kehapus)"}</span>
                                    <CopyButton textToCopy={row.items?.item_name ?? ""} className="h-6 w-6 shrink-0" />
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{row.items?.games?.name ?? "—"}</TableCell>
                            <TableCell>{row.is_available ? <StatusBadge variant="success">Tersedia</StatusBadge> : <StatusBadge variant="danger">Habis</StatusBadge>}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">{row.stock_notes || "—"}</TableCell>
                            <TableCell className="text-right">
                                <ItemRowActions accountId={id} accountItem={row} />
                            </TableCell>
                        </TableRow>
                    )}
                />
            )}
        </PageContainer>
    );
}
