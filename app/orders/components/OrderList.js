"use client";

import { CalendarIcon, CheckIcon, ChevronsUpDownIcon, CopyIcon, FilterIcon, Gamepad2Icon, Loader2Icon, MessageSquareIcon, RefreshCwIcon, SearchIcon, TimerIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

import TokenStatusNotice from "@/components/molecules/TokenStatusNotice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { cn } from "@/lib/utils";

import { formatDeliveryTime, getStatusIcon, timeAgo } from "./utils";

export default function OrderList({ activeOrderList, activeOrderId, setActiveOrderId, isLoadingOrders, fetchOrders, apiError, tokenStatus = "ok", tokenFailure = null, tokenRetryCount = 0, searchInput, setSearchInput, handleSearchSubmit, openFilter, setOpenFilter, orderStateFilter, setOrderStateFilter, handleScroll, isFetchingNextPage, hasNextPage, chatPreviews = {}, talkUserId }) {
    const { getGameName } = useEldoradoLibrary();
    return (
        <div className="flex h-full w-full shrink-0 flex-col gap-3 md:w-1/3">
            <div className="relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md">
                <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-br to-transparent"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="neon-text-primary text-2xl font-bold tracking-widest uppercase">My Orderan Gweh</h1>
                        {/* <p className="text-[10px] font-medium tracking-wide text-zinc-500">Kelola pesanan aktif Eldorado secara real-time</p> */}
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => fetchOrders("", false)} disabled={isLoadingOrders} title="Refresh Orders">
                        <RefreshCwIcon className={`h-4 w-4 ${isLoadingOrders ? "text-primary animate-spin" : ""}`} />
                    </Button>
                </div>

                {/* Filter UI */}
                <div className="relative z-10 flex gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <SearchIcon className="absolute top-2 left-2.5 h-4 w-4 text-zinc-500" />
                        <input type="text" placeholder="Nyari apaan..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="focus:border-primary/50 h-8 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pr-3 pl-8 text-xs text-zinc-200 transition-colors placeholder:text-zinc-600 focus:outline-none" />
                    </form>
                    <div className="shrink-0">
                        <Popover open={openFilter} onOpenChange={setOpenFilter}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={openFilter} className="h-8 w-[120px] justify-between border-zinc-800 bg-zinc-950/80 px-2.5 text-xs font-normal text-zinc-200 transition-colors hover:bg-zinc-900/50 focus:outline-none">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <FilterIcon className="h-3 w-3 shrink-0 text-zinc-500" />
                                        <span className="truncate">
                                            {[
                                                { value: "", label: "Semua" },
                                                { value: "Initialized", label: "Initialized" },
                                                { value: "Paid", label: "Paid" },
                                                { value: "Delivered", label: "Delivered" },
                                                { value: "Received", label: "Received" },
                                                { value: "Completed", label: "Completed" },
                                                { value: "Disputed", label: "Disputed" },
                                                { value: "Canceled", label: "Canceled" },
                                            ].find((s) => s.value === orderStateFilter)?.label || "Semua"}
                                        </span>
                                    </div>
                                    <ChevronsUpDownIcon className="h-3 w-3 shrink-0 text-zinc-500" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[130px] border-zinc-800 bg-zinc-950 p-1.5 text-zinc-200 shadow-xl" align="start">
                                <div className="flex flex-col gap-0.5">
                                    {[
                                        { value: "", label: "Semua" },
                                        { value: "Initialized", label: "Initialized" },
                                        { value: "Paid", label: "Paid" },
                                        { value: "Delivered", label: "Delivered" },
                                        { value: "Received", label: "Received" },
                                        { value: "Completed", label: "Completed" },
                                        { value: "Disputed", label: "Disputed" },
                                        { value: "Canceled", label: "Canceled" },
                                    ].map((status) => {
                                        const isChecked = orderStateFilter === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                onClick={() => {
                                                    setOrderStateFilter(status.value);
                                                    setOpenFilter(false);
                                                }}
                                                className={cn("flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white", isChecked && "text-primary bg-zinc-900 font-medium")}
                                            >
                                                <span className="truncate">{status.label}</span>
                                                {isChecked && <CheckIcon className="text-primary h-3 w-3 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-2" onScroll={handleScroll}>
                {isLoadingOrders ? (
                    <div className="flex flex-col gap-2">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i} className="border-zinc-800 bg-zinc-900/40 p-2.5">
                                <div className="flex items-start justify-between">
                                    <div className="flex w-2/3 flex-col gap-2">
                                        <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                                        <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                                        <Skeleton className="h-3 w-2/3 bg-zinc-800" />
                                    </div>
                                    <div className="flex w-1/4 flex-col items-end gap-2">
                                        <Skeleton className="h-4 w-full bg-zinc-800" />
                                        <Skeleton className="mt-1 h-4 w-2/3 bg-zinc-800" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : tokenStatus !== "ok" && activeOrderList.length === 0 ? (
                    <TokenStatusNotice status={tokenStatus} failure={tokenFailure} retryCount={tokenRetryCount} />
                ) : apiError ? (
                    <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                        {apiError}
                        <p className="mt-2 text-xs opacity-70">Coba refresh bentar lagi ya bro.</p>
                    </div>
                ) : activeOrderList.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">Nggak ada pesanan aktif saat ini bro.</div>
                ) : (
                    activeOrderList.map((order) => {
                        const chatPreview = order.talkJsConversationId ? chatPreviews[order.talkJsConversationId] : null;
                        const hasUnread = chatPreview?.unreadCount > 0;
                        const isActive = activeOrderId === order.id;

                        let cardClasses = "cursor-pointer border transition-all ";
                        if (isActive) {
                            cardClasses += "border-primary/50 bg-zinc-800/80 shadow-[0_0_10px_rgba(255,0,255,0.1)]";
                        } else if (hasUnread) {
                            cardClasses += "border-green-500/40 bg-zinc-800/90 hover:bg-zinc-700/80 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                        } else {
                            cardClasses += "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40";
                        }

                        return (
                            <Card key={order.id} className={cardClasses} onClick={() => setActiveOrderId(order.id)}>
                                <div className="flex flex-col gap-2 p-2">
                                    <div className="flex items-start justify-between text-sm font-bold text-zinc-200">
                                        <div className="flex max-w-[65%] flex-col">
                                            <span className="text-primary flex items-center gap-1.5 truncate font-bold">
                                                <UserIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                                <span className="truncate">{order.buyer || order.buyerName || "Buyer"}</span>
                                            </span>
                                            <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                                                <CalendarIcon className="h-3 w-3" />
                                                {order.createdDate || order.raw?.createdDate ? new Date(order.createdDate || order.raw.createdDate).toLocaleString() : "-"}
                                            </span>
                                        </div>
                                        <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                                            <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${order.status === "Completed" ? "border border-green-500/30 bg-green-500/20 text-green-400" : order.status === "Delivered" ? "border border-blue-500/30 bg-blue-500/20 text-blue-400" : order.status === "Paid" ? "border border-yellow-500/30 bg-yellow-500/20 text-yellow-400" : order.status === "Canceled" || order.status === "Canceled" ? "border border-red-500/30 bg-red-500/20 text-red-400" : "border border-zinc-700 bg-zinc-800 text-zinc-300"}`}>
                                                {getStatusIcon(order.status, "w-3 h-3")}
                                                {order.status || "Unknown"}
                                            </span>
                                            {order.raw?.deliveryTime && ["Delivered", "Received", "Completed"].includes(order.status) && (
                                                <p className="flex items-center gap-1 rounded border border-zinc-700/50 bg-zinc-800/50 px-1 py-0.5 font-mono text-[9px] text-zinc-400">
                                                    <TimerIcon className="h-2.5 w-2.5" />
                                                    {formatDeliveryTime(order.raw.deliveryTime)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between rounded border border-zinc-800/50 bg-zinc-950/50 p-1.5">
                                            <div className="flex items-center gap-2 truncate text-sm font-medium text-zinc-300">
                                                {order.raw?.orderOfferDetails?.mainOfferImage?.smallImage ? <img src={`https://assetsdelivery.eldorado.gg/v7/_offers-v2_/${order.raw.orderOfferDetails.mainOfferImage.smallImage}`} alt="Item" className="h-6 w-6 shrink-0 rounded object-cover" /> : <Gamepad2Icon className="h-4 w-4 shrink-0 text-zinc-500" />}
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button type="button" className="flex cursor-pointer flex-col truncate text-left transition-colors hover:text-white" title={order.game || order.gameName} onClick={(e) => e.stopPropagation()}>
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                                                {(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${order.raw?.orderOfferDetails?.gameId || order.raw?.gameId}.png`} alt="Game" className="h-3.5 w-3.5 rounded-sm object-cover opacity-90" />}
                                                                {getGameName(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) || "Game"}
                                                            </span>
                                                            <span className="truncate">{order.game || order.gameName || "Item"}</span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="z-50 flex w-auto flex-col gap-2 border-zinc-700 bg-zinc-900 p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase">
                                                                {(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${order.raw?.orderOfferDetails?.gameId || order.raw?.gameId}.png`} alt="Game" className="h-4 w-4 rounded-sm object-cover opacity-90" />}
                                                                {getGameName(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) || "Game"}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="max-w-xs text-sm font-medium break-all text-white">{order.game || order.gameName || "Item"}</span>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 shrink-0 text-zinc-400 hover:text-white"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigator.clipboard.writeText(order.game || order.gameName || "Item");
                                                                        // toast.success("Item name dicopy!");
                                                                    }}
                                                                >
                                                                    <CopyIcon className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <span className="bg-primary/20 text-primary ml-2 flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-bold">x{order.quantity || 1}</span>
                                        </div>

                                        {order.robloxUsername && (
                                            <div className="mt-0.5 flex">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(order.robloxUsername);
                                                        // toast.success("Roblox username dicopy!");
                                                    }}
                                                    className="text-accent bg-accent/10 hover:bg-accent/20 border-accent/20 flex cursor-pointer items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors"
                                                    title="Copy Roblox Username"
                                                >
                                                    <UserIcon className="h-3 w-3" />
                                                    RBLX: {order.robloxUsername}
                                                    <CopyIcon className="ml-0.5 h-3 w-3 opacity-50 hover:opacity-100" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Preview & Unread Indicator */}
                                    {(() => {
                                        const chatPreview = order.talkJsConversationId ? chatPreviews[order.talkJsConversationId] : null;
                                        if (!chatPreview) return null;
                                        return (
                                            <div className="flex items-center gap-2 rounded-lg border border-zinc-800/40 bg-zinc-950/60 px-2 py-1.5">
                                                <MessageSquareIcon className="h-3 w-3 shrink-0 text-zinc-500" />
                                                <p className="min-w-0 flex-1 truncate text-[11px] text-zinc-400">{chatPreview.lastMessage}</p>
                                                {chatPreview.timestamp > 0 && <span className="shrink-0 text-[10px] font-medium text-zinc-500">{timeAgo(chatPreview.timestamp)}</span>}
                                                {chatPreview.unreadCount > 0 && <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]"></span>}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </Card>
                        );
                    })
                )}

                {/* Loading Indicator for Infinity Scroll */}
                {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-4 text-zinc-500">
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> <span className="text-xs">Loading lagi...</span>
                    </div>
                )}
                {!hasNextPage && activeOrderList.length > 0 && !isLoadingOrders && <div className="py-3 text-center font-mono text-[10px] tracking-widest text-zinc-600 uppercase">--- Mentok Bos ---</div>}
            </div>
        </div>
    );
}
