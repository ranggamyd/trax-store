"use client";

import { Chatbox, Session } from "@talkjs/react";
import { CalendarIcon, CheckCircleIcon, CheckIcon, CopyIcon, Gamepad2Icon, InfoIcon, Loader2Icon, PencilIcon, SearchIcon, SendIcon, SparklesIcon, TimerIcon, UserIcon, XCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ComboboxSelect } from "@/components/molecules/ComboboxSelect";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { supabase } from "@/lib/supabase";
import { attachLibraryInfo, buildTemplateVars, fetchGamesWithAccounts, resolveTemplateText, unresolvedPlaceholders } from "@/lib/templateVars";
import { cn } from "@/lib/utils";

import { CANCEL_REASONS, formatDeliveryTime, getStatusIcon } from "./utils";
function ChatTemplateCard({ tmpl, onSend, isRecommended, compact = false, chatboxRef, game }) {
    // Template Specific: akun default dari template, tapi bisa diganti sebelum kirim.
    const [accountId, setAccountId] = useState(tmpl.account_id || "");

    const accounts = game?.accounts || [];
    const account = accounts.find((a) => a.account_id === accountId) || null;
    const templateVars = buildTemplateVars(game, account);
    const resolvedText = resolveTemplateText(tmpl.text, templateVars);
    // Placeholder yang belum kebisi (biasanya link private server kosong) — tahan dulu jangan kekirim.
    const blocked = unresolvedPlaceholders(tmpl.text, templateVars).length > 0;

    const handleInsertToChat = (e) => {
        e.stopPropagation();
        if (blocked) return;
        if (chatboxRef.current?.isAlive) {
            chatboxRef.current.messageField.setText(resolvedText);
            chatboxRef.current.messageField.focus();
        } else {
            navigator.clipboard.writeText(resolvedText);
        }
    };

    const handleSendClick = (e) => {
        e.stopPropagation();
        if (blocked) return;
        onSend({ ...tmpl, text: resolvedText });
    };

    const accountPicker =
        tmpl.type === "Specific" && tmpl.game_id ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} title={game ? `Akun buat ${game.name}` : "Game udah kehapus"}>
                <UserIcon className="text-muted-foreground h-2.5 w-2.5 shrink-0" />
                <ComboboxSelect
                    items={accounts}
                    value={accountId}
                    onSelect={(acc) => setAccountId(acc.account_id)}
                    getItemId={(acc) => acc.account_id}
                    getItemValue={(acc) => acc.username}
                    renderItem={(acc) => (
                        <span className="flex w-full items-center justify-between gap-2">
                            <span className="truncate">{acc.username}</span>
                            {!acc.private_server_link && <span className="text-warning shrink-0 text-[10px]">link kosong</span>}
                        </span>
                    )}
                    placeholder="-- Pilih akun --"
                    searchPlaceholder="Cari akun..."
                    emptyText="Game ini belum ada akunnya."
                    triggerClassName="h-6 min-w-0 overflow-hidden px-1.5 text-[9px] font-normal [&_svg]:size-3"
                    contentClassName="w-auto min-w-[180px]"
                />
            </div>
        ) : null;

    const blockedNote = blocked ? <p className="text-warning text-[9px] leading-tight">{accounts.length === 0 ? "Game ini belum ada akunnya — tautin dulu di /games." : account ? "Akun ini belum ada link private server-nya." : "Pilih akun dulu buat dapetin link-nya."}</p> : null;

    if (compact) {
        return (
            <div className={cn("group bg-surface-2/60 hover:bg-surface-3/80 relative flex h-full flex-col gap-2 rounded-lg border p-2.5 transition-colors", isRecommended ? "border-primary/40 border-l-primary border-l-2" : "border-border/80")}>
                {/* <div className="flex items-start gap-1 min-w-0">
                    <div className="flex-1 min-w-0">
                        <span className="block truncate text-[11px] font-bold text-foreground leading-tight">{tmpl.title}</span>
                        <span className="rounded bg-surface-3 px-1 text-[7px] font-extrabold uppercase text-muted-foreground">{tmpl.type}</span>
                    </div>
                </div> */}
                <p className="text-muted-foreground line-clamp-2 text-[10px] leading-tight break-words">&quot;{resolvedText}&quot;</p>
                {accountPicker}
                {blockedNote}
                <div className="border-border/60 mt-auto flex items-center gap-1 border-t pt-1">
                    <Button variant="ghost" size="icon" disabled={blocked} className="text-muted-foreground hover:text-foreground h-6 w-6 shrink-0" onClick={handleInsertToChat}>
                        <PencilIcon className="h-3 w-3" />
                    </Button>
                    <Button size="sm" disabled={blocked} className="bg-primary hover:bg-primary/90 text-primary-foreground h-6 min-w-0 flex-1 gap-1 px-1.5 text-[9px] font-bold" onClick={handleSendClick}>
                        <SendIcon className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">Kirim</span>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("group bg-surface-2/60 hover:bg-surface-3/80 relative flex items-center justify-between gap-3 rounded-lg border p-2 transition-colors", isRecommended ? "border-primary/40 border-l-primary border-l-2 shadow-[var(--glow-primary)]" : "border-border/80")}>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                {/* <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-foreground">{tmpl.title}</span>
                    <span className="rounded bg-surface-3 px-1 py-0.2 text-[8px] font-extrabold uppercase text-muted-foreground">{tmpl.type}</span>
                </div> */}
                <p className="text-muted-foreground truncate text-[10px]">&quot;{resolvedText}&quot;</p>
                {accountPicker}
                {blockedNote}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="ghost" size="icon" disabled={blocked} className="text-muted-foreground hover:text-foreground h-6 w-6" onClick={handleInsertToChat}>
                    <PencilIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline-primary" disabled={blocked} className="bg-primary hover:bg-primary/90 text-primary-foreground h-6.5 gap-1 px-2 text-[10px] font-bold" onClick={handleSendClick}>
                    <SendIcon className="h-2.5 w-2.5 shrink-0" />
                    Kirim
                </Button>
            </div>
        </div>
    );
}

function QuickRepliesPopover({ activeOrderDetails, onSend, chatboxRef }) {
    const { library } = useEldoradoLibrary();
    const [search, setSearch] = useState("");
    const [templates, setTemplates] = useState([]);
    const [linkedGames, setLinkedGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Nama game diambil dari Eldorado library, baris `games` cuma penghubung ke akun + link.
    const gamesByUuid = useMemo(() => Object.fromEntries(attachLibraryInfo(linkedGames, library).map((g) => [g.id, g])), [linkedGames, library]);

    const currentStatus = activeOrderDetails?.status?.toLowerCase() || "";
    const orderGameId = String(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId || "");

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        const [{ data, error }, gamesList] = await Promise.all([supabase.from("chat_templates").select("*").order("sort_order", { ascending: true }), fetchGamesWithAccounts()]);
        setLinkedGames(gamesList);
        if (error) {
            // toast.error("Gagal ambil template: " + error.message);
        } else {
            // Urutkan recommended paling atas, sisanya mengikuti sort_order bawaan
            let sorted = (data || []).sort((a, b) => {
                const aRec = a.triggers?.includes(currentStatus) ? 1 : 0;
                const bRec = b.triggers?.includes(currentStatus) ? 1 : 0;
                if (aRec !== bRec) {
                    return bRec - aRec;
                }
                return (a.sort_order === 0 ? Infinity : a.sort_order) - (b.sort_order === 0 ? Infinity : b.sort_order);
            });
            setTemplates(sorted);
        }
        setIsLoading(false);
    }, [currentStatus]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data, loading flag-nya sengaja di-set biar spinner langsung nongol
        fetchTemplates();
    }, [fetchTemplates]);

    const filtered = templates.filter((t) => {
        // Template Specific yang nempel ke game lain gak nyambung sama order ini.
        const eldoradoId = gamesByUuid[t.game_id]?.eldorado_game_id;
        if (t.game_id && orderGameId && eldoradoId && eldoradoId !== orderGameId) return false;

        // Rekomendasi murni ngikutin trigger yang dipilih pas bikin template.
        if (search.trim() === "") {
            return t.triggers?.includes(currentStatus);
        }
        return t.text.toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase());
    });
    // Gak dibates jumlahnya — listnya udah scrollable (max-h-80), jadi semua rekomendasi kelihatan.
    const displayedTemplates = filtered;

    return (
        <div className="absolute right-6 bottom-24 z-50">
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full shadow-[var(--glow-primary)] transition-transform duration-300 hover:scale-110" title="Balesan cepat">
                        <SparklesIcon className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" sideOffset={8} collisionPadding={16} className="border-border bg-surface-1/95 mb-3 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2.5 overflow-hidden rounded-2xl border p-3 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="text-primary h-4 w-4" />
                            <h3 className="text-foreground text-sm font-bold">Balesan cepat</h3>
                        </div>
                        <div className="relative w-40 shrink-0">
                            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2" />
                            <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="focus:border-primary border-border bg-surface-2 text-foreground placeholder:text-muted-foreground h-7.5 w-full rounded-md border pr-2 pl-7.5 text-xs transition-colors focus:outline-none" />
                        </div>
                    </div>

                    <div className="custom-scrollbar -mr-1 flex max-h-80 flex-col gap-1.5 overflow-x-hidden overflow-y-auto pr-1">
                        {isLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2Icon className="text-muted-foreground h-5 w-5 animate-spin" />
                            </div>
                        ) : displayedTemplates.length > 0 ? (
                            <div className="flex flex-col gap-1.5 pb-1">
                                {Object.entries(
                                    displayedTemplates.reduce((groups, tmpl) => {
                                        const key = tmpl.sort_order ?? 0;
                                        if (!groups[key]) groups[key] = [];
                                        groups[key].push(tmpl);
                                        return groups;
                                    }, {})
                                )
                                    .sort(([a], [b]) => {
                                        const aOrder = Number(a) === 0 ? Infinity : Number(a);
                                        const bOrder = Number(b) === 0 ? Infinity : Number(b);

                                        return aOrder - bOrder;
                                    })
                                    .map(([order, group]) => (
                                        <div key={order} className={cn("gap-1.5", group.length === 1 ? "flex flex-col" : group.length === 3 ? "grid grid-cols-3 items-stretch" : "grid grid-cols-2 items-stretch")}>
                                            {group.map((tmpl) => (
                                                <div key={tmpl.id} className="min-w-0">
                                                    <ChatTemplateCard
                                                        tmpl={tmpl}
                                                        game={gamesByUuid[tmpl.game_id] || null}
                                                        chatboxRef={chatboxRef}
                                                        onSend={(t) => {
                                                            onSend(t);
                                                            setTemplates((prev) => prev.filter((x) => x.id !== t.id));
                                                        }}
                                                        isRecommended={tmpl.triggers?.includes(currentStatus)}
                                                        compact={group.length > 1}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-muted-foreground py-6 text-center text-xs">Template tidak ditemukan :(</div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

import { CopyablePill } from "./SharedUI";

export default function OrderDetail({ activeOrderId, activeOrderDetails, activeOrderFullDetails, isLoadingOrderDetails, handleMarkDelivered, isDelivering, handleCancelOrder, isCanceling, cancelReason, setCancelReason, cancelMessage, setCancelMessage, isCancelDialogOpen, setIsCancelDialogOpen, talkData, robloxUsernames }) {
    const { getGameName } = useEldoradoLibrary();
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const sessionRef = useRef(null);
    const chatboxRef = useRef(null);

    const handleQuickReplySend = (tmpl) => {
        if (!sessionRef.current || !activeOrderDetails?.talkJsConversationId) {
            // toast.error("Chat belum siap");
            return;
        }
        try {
            const conversation = sessionRef.current.getOrCreateConversation(activeOrderDetails.talkJsConversationId);
            conversation.sendMessage(tmpl.text);
            // toast.success("Pesan terkirim");
        } catch {
            // toast.error("Gagal ngirim pesan")
        }
    };

    if (!activeOrderDetails) {
        return (
            <div className="border-border bg-surface-2/40 flex h-full flex-1 flex-col overflow-hidden rounded-2xl border backdrop-blur-sm">
                <div className="text-muted-foreground flex flex-1 items-center justify-center">Pilih pesanan di sebelah kiri buat lihat detail super komplit.</div>
            </div>
        );
    }

    const review = activeOrderDetails?.raw?.review || activeOrderFullDetails?.review || activeOrderDetails?.review;

    return (
        <div className="border-border bg-surface-2/40 relative flex h-full flex-1 flex-col overflow-hidden rounded-2xl border backdrop-blur-sm">
            <div className="absolute inset-0 z-0 bg-[url('/cyberpunk_hero.jpg')] bg-cover bg-center bg-no-repeat opacity-20"></div>
            <div className="absolute inset-0 z-0 bg-black/80"></div>

            <div className="relative z-10 flex h-full flex-col">
                {/* Fixed Header */}
                <div className="border-border/50 relative flex shrink-0 items-center justify-between overflow-hidden border-b bg-black/40 p-6 shadow-lg backdrop-blur-xl">
                    <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-r via-transparent to-transparent opacity-50"></div>

                    <div className="relative z-10 min-w-0 flex-1">
                        {/* Title */}
                        <h1 className="text-foreground flex min-w-0 items-center gap-3 text-2xl font-bold">
                            {activeOrderDetails?.raw?.orderOfferDetails?.mainOfferImage?.smallImage ? (
                                <img src={`https://assetsdelivery.eldorado.gg/v7/_offers-v2_/${activeOrderDetails.raw.orderOfferDetails.mainOfferImage.smallImage}`} alt="Item" className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-[var(--glow-primary)]" />
                            ) : (
                                <div className="bg-primary/20 border-primary/30 shrink-0 rounded-xl border p-2 shadow-[var(--glow-primary)]">
                                    <InfoIcon className="text-primary h-6 w-6 shrink-0" />
                                </div>
                            )}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button type="button" className="hover:text-foreground flex cursor-pointer flex-col truncate text-left transition-colors" title={activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"} onClick={(e) => e.stopPropagation()}>
                                        <span className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                                            {(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId}.png`} alt="Game" className="h-5 w-5 rounded-md object-cover shadow-sm" />}
                                            {getGameName(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) || "Game"}
                                        </span>
                                        <span className="truncate">{activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="border-border bg-surface-2 z-50 flex w-auto flex-col gap-2 p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold uppercase">
                                            {(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId}.png`} alt="Game" className="h-4 w-4 rounded-sm object-cover opacity-90" />}
                                            {getGameName(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) || "Game"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground max-w-xs text-sm font-medium break-all">{activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-foreground h-6 w-6 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order");
                                                    // toast.success("Nama item dicopy");
                                                }}
                                            >
                                                <CopyIcon className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <span className="border-border bg-surface-2 text-muted-foreground shrink-0 rounded-md border px-2 py-0.5 font-mono text-lg">x{activeOrderDetails?.quantity || 1}</span>
                            <span className="text-accent bg-accent/10 border-accent/20 ml-2 shrink-0 rounded-md border px-2 py-0.5 text-lg font-bold">{activeOrderDetails?.totalPrice || (activeOrderDetails?.raw?.totalPrice?.amount ? `$${activeOrderDetails.raw.totalPrice.amount.toFixed(2)}` : "-")}</span>
                        </h1>

                        {/* Inline Info & Buttons */}
                        <div className="mt-3 ml-14 flex flex-col gap-3">
                            <div className="flex items-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_ELDORADO_URL}/order/${activeOrderId}`);
                                        // toast.success("Link order dicopy");
                                        setIsLinkCopied(true);
                                        setTimeout(() => setIsLinkCopied(false), 2000);
                                    }}
                                    className="border-border/50 bg-surface-3/50 text-muted-foreground hover:bg-surface-3/50 hover:text-foreground flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs transition-colors"
                                    title="Copy link order"
                                >
                                    {process.env.NEXT_PUBLIC_ELDORADO_URL}/order/{activeOrderId}
                                    {isLinkCopied ? <CheckIcon className="text-success h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="text-foreground/85 flex items-center gap-1.5 text-sm font-medium">
                                    <UserIcon className="text-muted-foreground h-4 w-4" />
                                    {activeOrderDetails.buyer || activeOrderDetails.buyerName || "Buyer"}
                                </div>

                                {/* Waktu detail order baru masih loading, JANGAN render username sisa
                                    order sebelumnya — salah copy username = salah kirim barang.
                                    Skeleton dulu sampai username punya order ini bener-bener nyampe. */}
                                {isLoadingOrderDetails ? (
                                    <>
                                        <span className="bg-surface-3 h-1 w-1 rounded-full"></span>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <Gamepad2Icon className="text-muted-foreground h-4 w-4" />
                                            <Skeleton className="bg-surface-3 h-[26px] w-28 rounded-full" />
                                        </div>
                                    </>
                                ) : (
                                    robloxUsernames?.length > 0 && (
                                        <>
                                            <span className="bg-surface-3 h-1 w-1 rounded-full"></span>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Gamepad2Icon className="text-muted-foreground h-4 w-4" />
                                                {robloxUsernames.map((uname, idx) => (
                                                    <CopyablePill key={idx} value={uname} />
                                                ))}
                                            </div>
                                        </>
                                    )
                                )}

                                <span className="bg-surface-3 h-1 w-1 rounded-full"></span>

                                <div className="text-foreground/85 flex items-center gap-1.5 text-sm font-medium">
                                    <CalendarIcon className="text-muted-foreground h-4 w-4" />
                                    {activeOrderDetails.createdDate || activeOrderDetails.raw?.createdDate ? new Date(activeOrderDetails.createdDate || activeOrderDetails.raw.createdDate).toLocaleString() : "-"}
                                </div>
                            </div>

                            {/* Review Box */}
                            {activeOrderDetails.status === "Completed" && review && (review.reviewMessage || review.feedbackTags?.length > 0) && (
                                <div className="border-border/60 bg-surface-2/60 mt-1 flex flex-col gap-2 rounded-xl border p-3 shadow-inner">
                                    {review.reviewMessage && (
                                        <div className="flex items-start gap-2.5">
                                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm ${review.feedbackRating === "Positive" ? "border-success/20 bg-success/20 text-success border" : "border-danger/20 bg-danger/20 text-danger border"}`}>{review.feedbackRating === "Positive" ? <CheckIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}</div>
                                            <p className="text-foreground/85 text-sm leading-relaxed italic">&quot;{review.reviewMessage}&quot;</p>
                                        </div>
                                    )}

                                    {review.feedbackTags && review.feedbackTags.length > 0 && (
                                        <div className={`flex flex-wrap gap-1.5 ${review.reviewMessage ? "pl-7" : ""}`}>
                                            {review.feedbackTags.map((tag, idx) => (
                                                <span key={idx} className="border-border/50 bg-surface-3/80 text-muted-foreground hover:bg-surface-3 hover:text-foreground rounded-md border px-2 py-0.5 text-[10px] font-medium shadow-sm transition-colors">
                                                    {tag.replace(/([A-Z])/g, " $1").trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {["Paid", "Delivered", "Disputed"].includes(activeOrderDetails?.status) && (
                                    <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button className="border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 h-10 border px-4 font-bold transition-all duration-300">
                                                <XCircleIcon className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="text-foreground border-border bg-surface-1 max-w-md">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2 text-xl">
                                                    <InfoIcon className="h-5 w-5" /> Cancel order
                                                </AlertDialogTitle>
                                            </AlertDialogHeader>
                                            <div className="flex flex-col gap-3 py-2">
                                                <p className="text-sm font-medium">Cancellation reason:</p>
                                                <div className="flex flex-col gap-2">
                                                    {CANCEL_REASONS.map((reason) => (
                                                        <label key={reason.value} className="flex cursor-pointer items-center gap-2 text-sm">
                                                            <input type="radio" name="cancelReason" value={reason.value} checked={cancelReason === reason.value} onChange={(e) => setCancelReason(e.target.value)} className="text-primary focus:ring-primary accent-primary h-4 w-4" />
                                                            <span className="text-foreground/85">{reason.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <p className="text-sm font-medium">Kirim detail</p>
                                                    <span className="text-muted-foreground text-xs">{cancelMessage.length}/500</span>
                                                </div>
                                                <textarea value={cancelMessage} onChange={(e) => setCancelMessage(e.target.value.substring(0, 500))} className="focus:border-primary border-border bg-surface-2 text-foreground h-24 w-full resize-none rounded-md border p-2 text-sm focus:outline-none" placeholder="Catatan tambahan buat buyer (opsional)..." />
                                            </div>
                                            <AlertDialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                                                <AlertDialogCancel className="border-border bg-surface-3 text-foreground/85 hover:bg-surface-3 hover:text-foreground mt-0">Balik</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleCancelOrder} className="bg-warning hover:bg-warning/90 mt-0 font-bold text-black" disabled={isCanceling}>
                                                    {isCanceling ? "Canceling..." : "Cancel order"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                {["Paid", "Disputed"].includes(activeOrderDetails?.status) && (
                                    <Button onClick={handleMarkDelivered} disabled={isDelivering} className="border-warning bg-warning hover:bg-warning/90 h-10 border px-4 font-bold text-black shadow-[0_0_15px_rgb(251_191_36_/_0.4)] transition-all duration-300 hover:shadow-[0_0_25px_rgb(251_191_36_/_0.6)]">
                                        {isDelivering ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircleIcon className="mr-2 h-4 w-4" />}
                                        {isDelivering ? "Loading..." : "Deliver"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Status Badge */}
                    <div className="relative z-10 ml-4 flex shrink-0 flex-row items-center gap-3">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`flex aspect-square min-w-[90px] flex-col items-center justify-center gap-1.5 rounded-2xl text-center shadow-lg ${activeOrderDetails.status === "Completed" ? "border-success/30 bg-success/20 text-success border-2 shadow-[0_0_15px_rgb(52_211_153_/_0.2)]" : activeOrderDetails.status === "Delivered" ? "border-accent/30 bg-accent/20 text-accent border-2 shadow-[0_0_15px_rgb(34_211_238_/_0.2)]" : activeOrderDetails.status === "Paid" ? "border-warning/30 bg-warning/20 text-warning border-2 shadow-[0_0_15px_rgb(251_191_36_/_0.2)]" : activeOrderDetails.status === "Canceled" || activeOrderDetails.status === "Canceled" ? "border-danger/30 bg-danger/20 text-danger border-2 shadow-[0_0_15px_rgb(251_95_126_/_0.2)]" : "border-border/80 bg-surface-3/80 text-foreground/85 border-2"}`}>
                                {getStatusIcon(activeOrderDetails.status, "w-7 h-7")}
                                <span className="text-[10px] font-bold tracking-wider uppercase">{activeOrderDetails.status || "Unknown"}</span>
                            </div>

                            {/* Delivery Time Below Status */}
                            {activeOrderDetails?.raw?.deliveryTime && ["Delivered", "Received", "Completed"].includes(activeOrderDetails.status) && (
                                <div className="border-border bg-surface-2/50 text-foreground/85 flex w-full items-center justify-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold shadow-inner">
                                    <TimerIcon className="text-primary h-3.5 w-3.5" />
                                    {formatDeliveryTime(activeOrderDetails.raw.deliveryTime)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Quick Replies */}
                {activeOrderDetails && !isLoadingOrderDetails && <QuickRepliesPopover activeOrderDetails={activeOrderDetails} onSend={handleQuickReplySend} chatboxRef={chatboxRef} />}

                {/* Live Chat is rendered below details */}
                {/* Scrollable Content */}
                <div className="relative flex min-h-0 flex-1 flex-col">
                    {isLoadingOrderDetails && (
                        <div className="bg-surface-2/50 absolute inset-0 z-20 flex min-h-0 w-full flex-1 flex-col p-4 backdrop-blur-sm">
                            <Skeleton className="bg-surface-3/50 w-full flex-1 rounded-xl" />
                        </div>
                    )}

                    <div className="flex min-h-0 w-full flex-1 flex-col">
                        {talkData && activeOrderDetails.talkJsConversationId ? (
                            <div className="min-h-0 w-full flex-1 overflow-hidden">
                                <Session sessionRef={sessionRef} appId={process.env.NEXT_PUBLIC_TALKJS_APP_ID} userId={talkData.userId} tokenFetcher={() => talkData.token}>
                                    <Chatbox chatboxRef={chatboxRef} syncId="chatbox" conversationId={activeOrderDetails.talkJsConversationId} showChatHeader={false} messageFilter={{ type: ["!=", "SystemMessage"] }} style={{ width: "100%", height: "100%" }} />
                                </Session>
                            </div>
                        ) : (
                            <div className="text-muted-foreground flex h-full items-center justify-center">
                                {!talkData ? (
                                    <>
                                        <Loader2Icon className="mr-2 h-5 w-5 animate-spin" /> Loading Chat...
                                    </>
                                ) : (
                                    "Tidak ada percakapan untuk order ini."
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
