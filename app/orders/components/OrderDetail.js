"use client";

import { Chatbox, Session } from "@talkjs/react";
import { CalendarIcon, CheckCircleIcon, CheckIcon, CopyIcon, Gamepad2Icon, InfoIcon, Loader2Icon, PencilIcon, SearchIcon, SendIcon, SparklesIcon, TimerIcon, UserIcon, XCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import { CANCEL_REASONS, formatDeliveryTime, getStatusIcon } from "./utils";
function ChatTemplateCard({ tmpl, onSend, isRecommended, compact = false, chatboxRef }) {
    const [copied, setCopied] = useState(false);

    if (compact) {
        return (
            <div className={cn("group relative flex h-full flex-col gap-2 rounded-lg border bg-zinc-900/60 p-2.5 transition-colors hover:bg-zinc-800/80", isRecommended ? "border-primary/40 border-l-primary border-l-2" : "border-zinc-800/80")}>
                {/* <div className="flex items-start gap-1 min-w-0">
                    <div className="flex-1 min-w-0">
                        <span className="block truncate text-[11px] font-bold text-zinc-100 leading-tight">{tmpl.title}</span>
                        <span className="rounded bg-zinc-800 px-1 text-[7px] font-extrabold uppercase text-zinc-500">{tmpl.type}</span>
                    </div>
                </div> */}
                <p className="line-clamp-2 text-[10px] leading-tight text-zinc-400">"{tmpl.text}"</p>
                <div className="mt-auto flex items-center gap-1 border-t border-zinc-800/60 pt-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 text-zinc-400 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (chatboxRef.current?.isAlive) {
                                chatboxRef.current.messageField.setText(tmpl.text);
                                chatboxRef.current.messageField.focus();
                                setCopied(true);
                                // toast.success("Template masuk ke chat!");
                                setTimeout(() => setCopied(false), 2000);
                            } else {
                                navigator.clipboard.writeText(tmpl.text);
                                setCopied(true);
                                // toast.success("Template dicopy!");
                                setTimeout(() => setCopied(false), 2000);
                            }
                        }}
                    >
                        <PencilIcon className="h-3 w-3" />
                    </Button>
                    <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-6 flex-1 gap-1 px-2 text-[9px] font-bold"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSend(tmpl);
                        }}
                    >
                        <SendIcon className="h-2 w-2 shrink-0" />
                        Kirim
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("group relative flex items-center justify-between gap-3 rounded-lg border bg-zinc-900/60 p-2 transition-colors hover:bg-zinc-800/80", isRecommended ? "border-primary/40 border-l-primary border-l-2 shadow-[0_0_8px_rgba(var(--primary),0.05)]" : "border-zinc-800/80")}>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                {/* <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-zinc-200">{tmpl.title}</span>
                    <span className="rounded bg-zinc-800 px-1 py-0.2 text-[8px] font-extrabold uppercase text-zinc-400">{tmpl.type}</span>
                </div> */}
                <p className="truncate text-[10px] text-zinc-400">"{tmpl.text}"</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (chatboxRef.current?.isAlive) {
                            chatboxRef.current.messageField.setText(tmpl.text);
                            chatboxRef.current.messageField.focus();
                            setCopied(true);
                            // toast.success("Template masuk ke chat!");
                            setTimeout(() => setCopied(false), 2000);
                        } else {
                            navigator.clipboard.writeText(tmpl.text);
                            setCopied(true);
                            // toast.success("Template dicopy!");
                            setTimeout(() => setCopied(false), 2000);
                        }
                    }}
                >
                    <PencilIcon className="h-3 w-3" />
                </Button>
                <Button
                    size="sm"
                    variant="outline-primary"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-6.5 gap-1 px-2 text-[10px] font-bold"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSend(tmpl);
                    }}
                >
                    <SendIcon className="h-2.5 w-2.5 shrink-0" />
                    Kirim
                </Button>
            </div>
        </div>
    );
}

function QuickRepliesPopover({ activeOrderDetails, onSend, chatboxRef }) {
    const [search, setSearch] = useState("");
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const currentStatus = activeOrderDetails?.status?.toLowerCase() || "";

    const fetchTemplates = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from("chat_templates").select("*").order("sort_order", { ascending: true });
        if (error) {
            // toast.error("Gagal load templates: " + error.message);
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
    };

    useEffect(() => {
        fetchTemplates();
    }, [currentStatus]);

    const handleUpdateSortOrder = async (id, newOrder) => {
        const { error } = await supabase.from("chat_templates").update({ sort_order: newOrder }).eq("id", id);

        if (error) {
            // toast.error("Gagal update urutan: " + error.message);
        } else {
            // Update state local untuk merubah sort order dan urutan list secara instan
            setTemplates((prev) => {
                const updated = prev.map((t) => (t.id === id ? { ...t, sort_order: newOrder } : t));
                return updated.sort((a, b) => {
                    const aRec = a.triggers?.includes(currentStatus) ? 1 : 0;
                    const bRec = b.triggers?.includes(currentStatus) ? 1 : 0;
                    if (aRec !== bRec) {
                        return bRec - aRec;
                    }
                    return (a.sort_order === 0 ? Infinity : a.sort_order) - (b.sort_order === 0 ? Infinity : b.sort_order);
                });
            });
        }
    };

    const filtered = templates.filter((t) => {
        if (search.trim() === "") {
            return t.triggers?.includes(currentStatus);
        }
        return t.text.toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase());
    });
    const displayedTemplates = filtered.slice(0, 5);

    return (
        <div className="absolute right-6 bottom-24 z-50">
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-transform duration-300 hover:scale-110" title="Quick Replies">
                        <SparklesIcon className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="mb-3 flex w-[360px] flex-col gap-2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="text-primary h-4 w-4" />
                            <h3 className="text-sm font-bold text-white">Quick Replies</h3>
                        </div>
                        <div className="relative w-40">
                            <SearchIcon className="absolute top-2 left-2 h-3.5 w-3.5 text-zinc-500" />
                            <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="focus:border-primary h-7.5 w-full rounded-md border border-zinc-800 bg-zinc-900 pr-2 pl-7.5 text-xs text-white transition-colors focus:outline-none" />
                        </div>
                    </div>

                    <div className="custom-scrollbar flex max-h-80 flex-col gap-1.5 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2Icon className="h-5 w-5 animate-spin text-zinc-500" />
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
                                        <div key={order} className={`flex gap-1.5 ${group.length > 1 ? "flex-row items-stretch" : "flex-col"}`}>
                                            {group.map((tmpl) => (
                                                <div key={tmpl.id} className={group.length > 1 ? "min-w-0 flex-1" : ""}>
                                                    <ChatTemplateCard
                                                        tmpl={tmpl}
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
                            <div className="py-6 text-center text-xs text-zinc-500">Template tidak ditemukan :(</div>
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
            // toast.error("Chat belum siap!");
            return;
        }
        try {
            const conversation = sessionRef.current.getOrCreateConversation(activeOrderDetails.talkJsConversationId);
            conversation.sendMessage(tmpl.text);
            // toast.success("Pesan terkirim ke chat!");
        } catch (err) {
            // toast.error("Gagal ngirim pesan: " + err.message);
        }
    };

    if (!activeOrderDetails) {
        return (
            <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
                <div className="flex flex-1 items-center justify-center text-zinc-500">Pilih pesanan di sebelah kiri buat lihat detail super komplit.</div>
            </div>
        );
    }

    const review = activeOrderDetails?.raw?.review || activeOrderFullDetails?.review || activeOrderDetails?.review;

    return (
        <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
            <div className="absolute inset-0 z-0 bg-[url('/cyberpunk_hero.jpg')] bg-cover bg-center bg-no-repeat opacity-20"></div>
            <div className="absolute inset-0 z-0 bg-black/80"></div>

            <div className="relative z-10 flex h-full flex-col">
                {/* Fixed Header */}
                <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-zinc-800/50 bg-black/40 p-6 shadow-lg backdrop-blur-xl">
                    <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-r via-transparent to-transparent opacity-50"></div>

                    <div className="relative z-10 min-w-0 flex-1">
                        {/* Title */}
                        <h1 className="flex min-w-0 items-center gap-3 text-2xl font-bold text-white">
                            {activeOrderDetails?.raw?.orderOfferDetails?.mainOfferImage?.smallImage ? (
                                <img src={`https://assetsdelivery.eldorado.gg/v7/_offers-v2_/${activeOrderDetails.raw.orderOfferDetails.mainOfferImage.smallImage}`} alt="Item" className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
                            ) : (
                                <div className="bg-primary/20 border-primary/30 shrink-0 rounded-xl border p-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                    <InfoIcon className="text-primary h-6 w-6 shrink-0" />
                                </div>
                            )}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button type="button" className="flex cursor-pointer flex-col truncate text-left transition-colors hover:text-white" title={activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"} onClick={(e) => e.stopPropagation()}>
                                        <span className="flex items-center gap-2 text-sm font-bold tracking-wider text-zinc-400 uppercase">
                                            {(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId}.png`} alt="Game" className="h-5 w-5 rounded-md object-cover shadow-sm" />}
                                            {getGameName(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) || "Game"}
                                        </span>
                                        <span className="truncate">{activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="z-50 flex w-auto flex-col gap-2 border-zinc-700 bg-zinc-900 p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase">
                                            {(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId}.png`} alt="Game" className="h-4 w-4 rounded-sm object-cover opacity-90" />}
                                            {getGameName(activeOrderDetails?.raw?.orderOfferDetails?.gameId || activeOrderDetails?.raw?.gameId) || "Game"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="max-w-xs text-sm font-medium break-all text-white">{activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 shrink-0 text-zinc-400 hover:text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order");
                                                    // toast.success("Item name dicopy!");
                                                }}
                                            >
                                                <CopyIcon className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <span className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-lg text-zinc-400">x{activeOrderDetails?.quantity || 1}</span>
                            <span className="text-accent bg-accent/10 border-accent/20 ml-2 shrink-0 rounded-md border px-2 py-0.5 text-lg font-bold">{activeOrderDetails?.totalPrice || (activeOrderDetails?.raw?.totalPrice?.amount ? `$${activeOrderDetails.raw.totalPrice.amount.toFixed(2)}` : "-")}</span>
                        </h1>

                        {/* Inline Info & Buttons */}
                        <div className="mt-3 ml-14 flex flex-col gap-3">
                            <div className="flex items-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_ELDORADO_URL}/order/${activeOrderId}`);
                                        // toast.success("Link order dicopy!");
                                        setIsLinkCopied(true);
                                        setTimeout(() => setIsLinkCopied(false), 2000);
                                    }}
                                    className="flex items-center gap-1.5 rounded-md border border-zinc-700/50 bg-zinc-800/50 px-2 py-1 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-zinc-200"
                                    title="Copy Order Link"
                                >
                                    {process.env.NEXT_PUBLIC_ELDORADO_URL}/order/{activeOrderId}
                                    {isLinkCopied ? <CheckIcon className="h-3.5 w-3.5 text-green-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                                    <UserIcon className="h-4 w-4 text-zinc-400" />
                                    {activeOrderDetails.buyer || activeOrderDetails.buyerName || "Buyer"}
                                </div>

                                {robloxUsernames?.length > 0 && (
                                    <>
                                        <span className="h-1 w-1 rounded-full bg-zinc-700"></span>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <Gamepad2Icon className="h-4 w-4 text-zinc-400" />
                                            {robloxUsernames.map((uname, idx) => (
                                                <CopyablePill key={idx} value={uname} />
                                            ))}
                                        </div>
                                    </>
                                )}

                                <span className="h-1 w-1 rounded-full bg-zinc-700"></span>

                                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                                    <CalendarIcon className="h-4 w-4 text-zinc-400" />
                                    {activeOrderDetails.createdDate || activeOrderDetails.raw?.createdDate ? new Date(activeOrderDetails.createdDate || activeOrderDetails.raw.createdDate).toLocaleString() : "-"}
                                </div>
                            </div>

                            {/* Review Box */}
                            {activeOrderDetails.status === "Completed" && review && (review.reviewMessage || review.feedbackTags?.length > 0) && (
                                <div className="mt-1 flex flex-col gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-3 shadow-inner">
                                    {review.reviewMessage && (
                                        <div className="flex items-start gap-2.5">
                                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm ${review.feedbackRating === "Positive" ? "border border-green-500/20 bg-green-500/20 text-green-400" : "border border-red-500/20 bg-red-500/20 text-red-400"}`}>{review.feedbackRating === "Positive" ? <CheckIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}</div>
                                            <p className="text-sm leading-relaxed text-zinc-300 italic">"{review.reviewMessage}"</p>
                                        </div>
                                    )}

                                    {review.feedbackTags && review.feedbackTags.length > 0 && (
                                        <div className={`flex flex-wrap gap-1.5 ${review.reviewMessage ? "pl-7" : ""}`}>
                                            {review.feedbackTags.map((tag, idx) => (
                                                <span key={idx} className="rounded-md border border-zinc-700/50 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 shadow-sm transition-colors hover:bg-zinc-700 hover:text-zinc-200">
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
                                            <Button className="h-10 border border-red-500/30 bg-red-500/10 px-4 font-bold text-red-500 transition-all duration-300 hover:bg-red-500/20">
                                                <XCircleIcon className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="text-foreground max-w-md border-zinc-800 bg-zinc-950">
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
                                                            <span className="text-zinc-300">{reason.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <p className="text-sm font-medium">Share details</p>
                                                    <span className="text-xs text-zinc-500">{cancelMessage.length}/500</span>
                                                </div>
                                                <textarea value={cancelMessage} onChange={(e) => setCancelMessage(e.target.value.substring(0, 500))} className="focus:border-primary h-24 w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 p-2 text-sm text-zinc-200 focus:outline-none" placeholder="Add any additional details..." />
                                            </div>
                                            <AlertDialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                                                <AlertDialogCancel className="mt-0 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white">Back</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleCancelOrder} className="mt-0 bg-yellow-500 font-bold text-black hover:bg-yellow-400" disabled={isCanceling}>
                                                    {isCanceling ? "Canceling..." : "Cancel order"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                {["Paid", "Disputed"].includes(activeOrderDetails?.status) && (
                                    <Button onClick={handleMarkDelivered} disabled={isDelivering} className="h-10 border border-yellow-400 bg-yellow-500 px-4 font-bold text-black shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all duration-300 hover:bg-yellow-400 hover:shadow-[0_0_25px_rgba(250,204,21,0.6)]">
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
                            <div className={`flex aspect-square min-w-[90px] flex-col items-center justify-center gap-1.5 rounded-2xl text-center shadow-lg ${activeOrderDetails.status === "Completed" ? "border-2 border-green-500/30 bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : activeOrderDetails.status === "Delivered" ? "border-2 border-blue-500/30 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : activeOrderDetails.status === "Paid" ? "border-2 border-yellow-500/30 bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]" : activeOrderDetails.status === "Canceled" || activeOrderDetails.status === "Canceled" ? "border-2 border-red-500/30 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-2 border-zinc-700/80 bg-zinc-800/80 text-zinc-300"}`}>
                                {getStatusIcon(activeOrderDetails.status, "w-7 h-7")}
                                <span className="text-[10px] font-bold tracking-wider uppercase">{activeOrderDetails.status || "Unknown"}</span>
                            </div>

                            {/* Delivery Time Below Status */}
                            {activeOrderDetails?.raw?.deliveryTime && ["Delivered", "Received", "Completed"].includes(activeOrderDetails.status) && (
                                <div className="flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs font-bold text-zinc-300 shadow-inner">
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
                        <div className="absolute inset-0 z-20 flex min-h-0 w-full flex-1 flex-col bg-zinc-900/50 p-4 backdrop-blur-sm">
                            <Skeleton className="w-full flex-1 rounded-xl bg-zinc-800/50" />
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
                            <div className="flex h-full items-center justify-center text-zinc-500">
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
