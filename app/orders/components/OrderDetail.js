"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Session, Chatbox } from "@talkjs/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { InfoIcon, CheckIcon, CopyIcon, UserIcon, Gamepad2Icon, CalendarIcon, XCircleIcon, CheckCircleIcon, Loader2Icon, TimerIcon, SparklesIcon, SearchIcon, SendIcon } from "lucide-react";
import { getStatusIcon, formatDeliveryTime, CANCEL_REASONS } from "./utils";
import { supabase } from "@/lib/supabase";
function ChatTemplateCard({ tmpl, onSend, isRecommended }) {
    const [copied, setCopied] = useState(false);
    const [isSending, setIsSending] = useState(false);

    return (
        <div className={`rounded-2xl border bg-zinc-900 p-4 text-zinc-200 shadow-xl ${isRecommended ? "border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "border-zinc-800"} flex h-full flex-col transition-all duration-300 hover:z-20 hover:scale-105 hover:shadow-2xl ${tmpl.style || ""} group relative min-h-[140px] w-full`}>
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-800/40 to-transparent"></div>
            {isRecommended && <div className="bg-primary text-primary-foreground absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-lg">Recommended</div>}
            <div className="relative z-10 mt-1 mb-2 flex items-start justify-between gap-2">
                <span className="text-sm leading-tight font-bold text-zinc-100">{tmpl.title}</span>
                <span className={`rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${tmpl.type === "General" ? "border border-blue-900/30 text-blue-400" : "border border-purple-900/30 text-purple-400"}`}>{tmpl.type}</span>
            </div>
            <p className="relative z-10 mt-1 mb-4 flex-1 text-xs font-medium text-zinc-300">"{tmpl.text}"</p>
            <div className="relative z-10 mt-auto flex flex-col gap-2 border-t border-zinc-800 pt-3">
                <div className="flex w-full gap-2">
                    <Button
                        variant="outline"
                        className="h-8 flex-1 border-zinc-700 bg-zinc-800/50 px-2 text-xs text-white hover:bg-zinc-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(tmpl.text);
                            setCopied(true);
                            toast.success("Template dicopy!");
                            setTimeout(() => setCopied(false), 2000);
                        }}
                    >
                        {copied ? <CheckIcon className="mr-1 h-3.5 w-3.5 shrink-0 text-green-400" /> : <CopyIcon className="mr-1 h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                        Copy
                    </Button>
                    <Button className="h-8 flex-1 cursor-not-allowed bg-zinc-800 px-2 text-xs text-zinc-500" disabled title="Sementara dinonaktifkan">
                        <SendIcon className="mr-1 h-3.5 w-3.5 shrink-0" />
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}

function QuickRepliesPopover({ activeOrderDetails }) {
    const [search, setSearch] = useState("");
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTemplates() {
            setIsLoading(true);
            const { data, error } = await supabase.from("chat_templates").select("*");
            if (error) {
                toast.error("Gagal load templates: " + error.message);
            } else {
                const currentStatus = activeOrderDetails?.status?.toLowerCase() || "";

                // Recommendation logic
                let sorted = (data || []).sort((a, b) => {
                    const aRec = a.triggers?.includes(currentStatus) ? 1 : 0;
                    const bRec = b.triggers?.includes(currentStatus) ? 1 : 0;
                    return bRec - aRec;
                });

                setTemplates(sorted);
            }
            setIsLoading(false);
        }

        if (activeOrderDetails) {
            fetchTemplates();
        }
    }, [activeOrderDetails]);

    const filtered = templates.filter((t) => t.text.toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase()));

    const currentStatus = activeOrderDetails?.status?.toLowerCase() || "";

    const handleSend = (tmpl) => {
        // TODO: implement actual talkjs programmatic send when session is available globally.
        toast.success(`Direct send: "${tmpl.title}" (Mock)`);
    };

    return (
        <div className="absolute right-6 bottom-24 z-50">
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-transform duration-300 hover:scale-110" title="Quick Replies">
                        <SparklesIcon className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="mb-4 flex w-[900px] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/90 p-0 shadow-2xl backdrop-blur-xl">
                    <div className="p-8 pb-4">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 text-primary rounded-xl p-2">
                                    <SparklesIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Quick Replies</h3>
                                    <p className="text-xs text-zinc-400">Pilih template buat bales chat bule dengan kilat</p>
                                </div>
                            </div>
                            <div className="relative w-64">
                                <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                <input type="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="focus:border-primary w-full rounded-full border border-zinc-700 bg-zinc-900 py-2 pr-4 pl-9 text-sm text-white transition-colors focus:outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-8 pb-8">
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2Icon className="h-6 w-6 animate-spin text-zinc-500" />
                            </div>
                        ) : filtered.length > 0 ? (
                            <div className="mt-2 flex flex-col gap-6 pr-6 pb-4">
                                {Array.from({ length: Math.ceil(filtered.length / 3) }).map((_, rowIdx) => {
                                    const rowItems = filtered.slice(rowIdx * 3, rowIdx * 3 + 3);
                                    return (
                                        <div key={rowIdx} className={`flex gap-6 ${rowIdx % 2 !== 0 ? "ml-12" : ""}`}>
                                            {rowItems.map((tmpl) => (
                                                <div key={tmpl.id} className="group/card relative max-w-[260px] min-w-[240px] flex-1 pt-3">
                                                    <ChatTemplateCard tmpl={tmpl} onSend={handleSend} isRecommended={tmpl.triggers?.includes(currentStatus)} />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-zinc-500">Template tidak ditemukan :(</div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
import { CopyablePill } from "./SharedUI";

export default function OrderDetail({ activeOrderId, activeOrderDetails, activeOrderFullDetails, isLoadingOrderDetails, handleMarkDelivered, isDelivering, handleCancelOrder, isCanceling, cancelReason, setCancelReason, cancelMessage, setCancelMessage, isCancelDialogOpen, setIsCancelDialogOpen, talkData, robloxUsernames }) {
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    if (!activeOrderDetails) {
        return (
            <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
                <div className="flex flex-1 items-center justify-center text-zinc-500">Pilih pesanan di sebelah kiri buat lihat detail super komplit.</div>
            </div>
        );
    }

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
                            <div className="bg-primary/20 border-primary/30 shrink-0 rounded-xl border p-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                <InfoIcon className="text-primary h-6 w-6 shrink-0" />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button type="button" className="cursor-pointer truncate text-left transition-colors hover:text-white" title={activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"} onClick={(e) => e.stopPropagation()}>
                                        {activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="z-50 flex w-auto items-center gap-2 border-zinc-700 bg-zinc-900 p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                    <span className="max-w-xs text-sm font-medium break-all text-white">{activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order"}</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 shrink-0 text-zinc-400 hover:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(activeOrderDetails?.game || activeOrderDetails?.gameName || "Detail Order");
                                            toast.success("Game name dicopy!");
                                        }}
                                    >
                                        <CopyIcon className="h-3.5 w-3.5" />
                                    </Button>
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
                                        toast.success("Link order dicopy!");
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
                            <div className={`flex aspect-square min-w-[90px] flex-col items-center justify-center gap-1.5 rounded-2xl text-center shadow-lg ${activeOrderDetails.status === "Completed" ? "border-2 border-green-500/30 bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : activeOrderDetails.status === "Delivered" ? "border-2 border-blue-500/30 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : activeOrderDetails.status === "Paid" ? "border-2 border-yellow-500/30 bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]" : activeOrderDetails.status === "Canceled" || activeOrderDetails.status === "Cancelled" ? "border-2 border-red-500/30 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-2 border-zinc-700/80 bg-zinc-800/80 text-zinc-300"}`}>
                                {getStatusIcon(activeOrderDetails.status, "w-7 h-7")}
                                <span className="text-[10px] font-bold tracking-wider uppercase">{activeOrderDetails.status || "Unknown"}</span>
                            </div>

                            {/* Delivery Time Below Status */}
                            {activeOrderDetails?.raw?.deliveryTime && ["Delivered", "Completed"].includes(activeOrderDetails.status) && (
                                <div className="flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs font-bold text-zinc-300 shadow-inner">
                                    <TimerIcon className="text-primary h-3.5 w-3.5" />
                                    {formatDeliveryTime(activeOrderDetails.raw.deliveryTime)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Quick Replies */}
                {activeOrderDetails && !isLoadingOrderDetails && <QuickRepliesPopover activeOrderDetails={activeOrderDetails} />}

                {/* Live Chat is rendered below details */}
                {/* Scrollable Content */}
                <div className="flex min-h-0 flex-1 flex-col">
                    {isLoadingOrderDetails ? (
                        <div className="flex min-h-0 w-full flex-1 flex-col p-4">
                            <Skeleton className="w-full flex-1 rounded-xl bg-zinc-800/50" />
                        </div>
                    ) : activeOrderFullDetails ? (
                        <div className="flex min-h-0 w-full flex-1 flex-col">
                            {talkData && activeOrderDetails.talkJsConversationId ? (
                                <div className="min-h-0 w-full flex-1 overflow-hidden">
                                    <Session appId={process.env.NEXT_PUBLIC_TALKJS_APP_ID} userId={talkData.userId} tokenFetcher={() => talkData.token}>
                                        <Chatbox conversationId={activeOrderDetails.talkJsConversationId} showChatHeader={false} messageFilter={{ type: ["!=", "SystemMessage"] }} style={{ width: "100%", height: "100%" }} />
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
                    ) : null}
                </div>
            </div>
        </div>
    );
}
