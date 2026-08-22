import { ArrowLeft, Package, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountRowActions } from "@/app/games/[id]/components/AccountRowActions";
import { DetailToolbar } from "@/app/games/[id]/components/DetailToolbar";
import { GameHeaderActions } from "@/app/games/[id]/components/GameHeaderActions";
import { ItemRowActions } from "@/app/games/[id]/components/ItemRowActions";
import { getGameDetail } from "@/app/games/[id]/queries";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { ClickableTableRow } from "@/components/molecules/ClickableTableRow";
import { PrivateServerLinkCell } from "@/components/molecules/PrivateServerLinkCell";
import { DataTable } from "@/components/organisms/DataTable";
import { PageContainer } from "@/components/templates/PageContainer";
import { TableCell, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import { formatWibDate } from "@/lib/wib";

const ACCOUNT_COLUMNS = [{ label: "Akun" }, { label: "Private server" }, { label: "Robux" }, { label: "Ditautkan", className: "text-right" }, { label: "Aksi", className: "text-right" }];

const ITEM_COLUMNS = [{ label: "Item" }, { label: "Deskripsi" }, { label: "Dibuat", className: "text-right" }, { label: "Aksi", className: "text-right" }];

export async function generateMetadata({ params }) {
    const { id } = await params;
    const detail = await getGameDetail(id);

    return { title: detail?.game?.name ?? "Game" };
}

/** SERVER COMPONENT. Pola yang sama kayak /accounts/[id]. */
export default async function GameDetailPage({ params, searchParams }) {
    const { id } = await params;
    const query = await searchParams;

    const detail = await getGameDetail(id);
    if (!detail) notFound();

    const { game, linkedAccounts, items, allAccounts } = detail;

    const tab = query?.tab === "items" ? "items" : "accounts";
    const search = (typeof query?.q === "string" ? query.q : "").trim().toLowerCase();

    const accounts = search ? linkedAccounts.filter((row) => (row.accounts?.username ?? "").toLowerCase().includes(search)) : linkedAccounts;

    const filteredItems = search ? items.filter((row) => (row.item_name ?? "").toLowerCase().includes(search) || (row.description ?? "").toLowerCase().includes(search)) : items;

    // Akun yang ketaut tapi link-nya kosong padahal game-nya wajib punya link.
    // Ditampilin di header — dulu keadaan ini cuma kelihatan waktu lu kebetulan
    // nyalain toggle-nya, padahal dampaknya nyata: template chat ngirim link kosong.
    const missingLinkCount = game.requires_private_server ? linkedAccounts.filter((row) => !row.private_server_link?.trim()).length : 0;

    const tabHref = (nextTab) => {
        const next = new URLSearchParams();
        if (nextTab === "items") next.set("tab", "items");
        const qs = next.toString();
        return qs ? `/games/${id}?${qs}` : `/games/${id}`;
    };

    return (
        <PageContainer>
            <header className="glass flex flex-col justify-between gap-4 rounded-2xl p-5 md:flex-row md:items-center md:p-6">
                <div className="flex min-w-0 items-center gap-4">
                    <Link href="/games" aria-label="Balik ke daftar game" className="text-muted-foreground hover:text-foreground hover:bg-surface-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    {game.image_url ? <span className="border-border bg-surface-3 h-14 w-14 shrink-0 rounded-xl border bg-cover bg-center" style={{ backgroundImage: `url(${game.image_url})` }} /> : <span className="border-border bg-surface-3 text-muted-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-lg font-bold">{getInitials(game.name)}</span>}

                    <div className="min-w-0">
                        <p className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">Game</p>
                        <h1 className="text-foreground flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <span className="truncate">{game.name}</span>
                            <CopyButton textToCopy={game.name} className="h-6 w-6 shrink-0" />
                        </h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {game.requires_private_server ? <StatusBadge variant="warning">Wajib private server</StatusBadge> : <StatusBadge variant="default">Private server opsional</StatusBadge>}
                            {game.eldorado_game_id && <span className="text-muted-foreground font-mono text-xs">Eldorado ID {game.eldorado_game_id}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                    <GameHeaderActions game={game} linkedAccountCount={linkedAccounts.length} itemCount={items.length} />
                </div>
            </header>

            {missingLinkCount > 0 && (
                <div className="border-warning/25 bg-warning/[0.07] flex items-start gap-3 rounded-2xl border p-4" role="alert">
                    <TriangleAlert className="text-warning mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        <strong className="text-foreground">{missingLinkCount} akun belum punya link private server </strong>
                        padahal game ini diwajibin. Template chat buat akun-akun itu bakal ngirim link kosong ke buyer — isi lewat tombol edit di baris masing-masing.
                    </p>
                </div>
            )}

            <nav className="border-border bg-surface-1/60 mx-auto grid w-full max-w-md grid-cols-2 gap-1 rounded-xl border p-1">
                <Link href={tabHref("accounts")} scroll={false} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === "accounts" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Users className="h-4 w-4" />
                    Akun
                    <span className="text-muted-foreground text-xs">({linkedAccounts.length})</span>
                </Link>
                <Link href={tabHref("items")} scroll={false} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === "items" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                    <Package className="h-4 w-4" />
                    Item
                    <span className="text-muted-foreground text-xs">({items.length})</span>
                </Link>
            </nav>

            <DetailToolbar game={game} allAccounts={allAccounts} gameItems={items} tab={tab} />

            {tab === "accounts" ? (
                <DataTable
                    columns={ACCOUNT_COLUMNS}
                    data={accounts}
                    emptyTitle={search ? `Gak ada akun yang cocok sama "${search}"` : "Belum ada akun yang ketaut ke game ini"}
                    emptyHint={search ? "Coba cari pakai potongan username-nya." : 'Klik "Tautin akun" buat nyambungin akun ke game ini.'}
                    renderRow={(row) => (
                        <ClickableTableRow key={row.id} href={`/accounts/${row.accounts?.id}`}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <span className="border-border bg-surface-3 text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold">{getInitials(row.accounts?.username)}</span>
                                    <span className="text-foreground truncate">{row.accounts?.username ?? "(akun kehapus)"}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <PrivateServerLinkCell link={row.private_server_link} />
                            </TableCell>
                            <TableCell>{row.accounts?.status === "EMPTY_ROBUX" ? <StatusBadge variant="danger">Habis</StatusBadge> : <StatusBadge variant="success">Ada</StatusBadge>}</TableCell>
                            <TableCell className="text-muted-foreground text-right text-sm">{formatWibDate(row.created_at)}</TableCell>
                            <TableCell className="text-right">
                                <AccountRowActions gameId={id} gameName={game.name} requiresPrivateServer={game.requires_private_server} accountGame={row} />
                            </TableCell>
                        </ClickableTableRow>
                    )}
                />
            ) : (
                <DataTable
                    columns={ITEM_COLUMNS}
                    data={filteredItems}
                    emptyTitle={search ? `Gak ada item yang cocok sama "${search}"` : "Game ini belum punya item"}
                    emptyHint={search ? "Coba kata kunci yang lebih pendek." : 'Klik "Item baru" buat nyatet item yang bisa dijual dari game ini.'}
                    renderRow={(row) => (
                        <TableRow key={row.id} className="border-border hover:bg-surface-2/60">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <span className="border-border bg-surface-3 text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold">{getInitials(row.item_name)}</span>
                                    <span className="text-foreground truncate">{row.item_name}</span>
                                    <CopyButton textToCopy={row.item_name} className="h-6 w-6 shrink-0" />
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[240px] truncate text-sm">{row.description || "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-right text-sm">{formatWibDate(row.created_at)}</TableCell>
                            <TableCell className="text-right">
                                <ItemRowActions game={game} item={row} allAccounts={allAccounts} />
                            </TableCell>
                        </TableRow>
                    )}
                />
            )}
        </PageContainer>
    );
}
