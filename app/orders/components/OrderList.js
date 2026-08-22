"use client";

import { CalendarIcon, CheckIcon, ChevronsUpDownIcon, CopyIcon, FilterIcon, Gamepad2Icon, Loader2Icon, MessageSquareIcon, RefreshCwIcon, SearchIcon, TimerIcon, UserIcon } from "lucide-react";

import TokenStatusNotice from "@/components/molecules/TokenStatusNotice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { cn } from "@/lib/utils";

import { formatDeliveryTime, getStatusIcon, timeAgo } from "./utils";

export default function OrderList({ activeOrderList, activeOrderId, setActiveOrderId, isLoadingOrders, fetchOrders, apiError, tokenStatus = "ok", tokenFailure = null, tokenRetryCount = 0, searchInput, setSearchInput, handleSearchSubmit, openFilter, setOpenFilter, orderStateFilter, setOrderStateFilter, handleScroll, isFetchingNextPage, hasNextPage, chatPreviews = {} }) {
    const { getGameName } = useEldoradoLibrary();
    return (
        <div className="flex h-full w-full shrink-0 flex-col gap-3 md:w-1/3">
            <div className="border-border bg-surface-2/50 relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border p-4 backdrop-blur-md">
                <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-br to-transparent"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-glow-primary text-2xl font-bold tracking-widest uppercase">Order Masuk</h1>
                        {/* <p className="text-[10px] font-medium tracking-wide text-muted-foreground">Semua order Eldorado, kekelola dari sini</p> */}
                    </div>
                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => fetchOrders("", false)} disabled={isLoadingOrders} title="Muat ulang order">
                        <RefreshCwIcon className={`h-4 w-4 ${isLoadingOrders ? "text-primary animate-spin" : ""}`} />
                    </Button>
                </div>

                {/* Filter UI */}
                <div className="relative z-10 flex gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <SearchIcon className="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
                        <input type="text" placeholder="Cari buyer, item, atau order ID..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="focus:border-primary/50 border-border bg-surface-1/80 text-foreground placeholder:text-muted-foreground/70 h-8 w-full rounded-lg border pr-3 pl-8 text-xs transition-colors focus:outline-none" />
                    </form>
                    <div className="shrink-0">
                        <Popover open={openFilter} onOpenChange={setOpenFilter}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={openFilter} className="border-border bg-surface-1/80 text-foreground hover:bg-surface-2/50 h-8 w-[120px] justify-between px-2.5 text-xs font-normal transition-colors focus:outline-none">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <FilterIcon className="text-muted-foreground h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                            {[
                                                { value: "", label: "Semua" },
                                                { value: "Initialized", label: "Baru masuk" },
                                                { value: "Paid", label: "Udah dibayar" },
                                                { value: "Delivered", label: "Udah dikirim" },
                                                { value: "Received", label: "Diterima buyer" },
                                                { value: "Completed", label: "Selesai" },
                                                { value: "Disputed", label: "Disengketain" },
                                                { value: "Canceled", label: "Dibatalin" },
                                            ].find((s) => s.value === orderStateFilter)?.label || "Semua"}
                                        </span>
                                    </div>
                                    <ChevronsUpDownIcon className="text-muted-foreground h-3 w-3 shrink-0" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="border-border bg-surface-1 text-foreground w-[130px] p-1.5 shadow-xl" align="start">
                                <div className="flex flex-col gap-0.5">
                                    {[
                                        { value: "", label: "Semua" },
                                        { value: "Initialized", label: "Baru masuk" },
                                        { value: "Paid", label: "Udah dibayar" },
                                        { value: "Delivered", label: "Udah dikirim" },
                                        { value: "Received", label: "Diterima buyer" },
                                        { value: "Completed", label: "Selesai" },
                                        { value: "Disputed", label: "Disengketain" },
                                        { value: "Canceled", label: "Dibatalin" },
                                    ].map((status) => {
                                        const isChecked = orderStateFilter === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                onClick={() => {
                                                    setOrderStateFilter(status.value);
                                                    setOpenFilter(false);
                                                }}
                                                className={cn("text-muted-foreground hover:bg-surface-2 hover:text-foreground flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-xs transition-colors", isChecked && "text-primary bg-surface-2 font-medium")}
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
                            <Card key={i} className="border-border bg-surface-2/40 p-2.5">
                                <div className="flex items-start justify-between">
                                    <div className="flex w-2/3 flex-col gap-2">
                                        <Skeleton className="bg-surface-3 h-4 w-3/4" />
                                        <Skeleton className="bg-surface-3 h-3 w-1/2" />
                                        <Skeleton className="bg-surface-3 h-3 w-2/3" />
                                    </div>
                                    <div className="flex w-1/4 flex-col items-end gap-2">
                                        <Skeleton className="bg-surface-3 h-4 w-full" />
                                        <Skeleton className="bg-surface-3 mt-1 h-4 w-2/3" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : tokenStatus !== "ok" && activeOrderList.length === 0 ? (
                    <TokenStatusNotice status={tokenStatus} failure={tokenFailure} retryCount={tokenRetryCount} />
                ) : apiError ? (
                    <div className="border-danger/50 bg-danger-muted/30 text-danger rounded-xl border p-4 text-sm">
                        {apiError}
                        <p className="mt-2 text-xs opacity-70">Coba muat ulang sebentar lagi</p>
                    </div>
                ) : activeOrderList.length === 0 ? (
                    <div className="text-muted-foreground p-4 text-center text-sm">Belum ada order masuk</div>
                ) : (
                    activeOrderList.map((order) => {
                        const chatPreview = order.talkJsConversationId ? chatPreviews[order.talkJsConversationId] : null;
                        const hasUnread = chatPreview?.unreadCount > 0;
                        const isActive = activeOrderId === order.id;

                        let cardClasses = "cursor-pointer border transition-all ";
                        if (isActive) {
                            cardClasses += "border-primary/50 bg-surface-3/80 shadow-[0_0_10px_rgb(124_92_255_/_0.1)]";
                        } else if (hasUnread) {
                            cardClasses += "border-success/40 bg-surface-3/90 hover:bg-surface-3/80 shadow-[0_0_15px_rgb(52_211_153_/_0.1)]";
                        } else {
                            cardClasses += "border-border bg-surface-2/40 hover:bg-surface-3/40";
                        }

                        return (
                            <Card key={order.id} className={cardClasses} onClick={() => setActiveOrderId(order.id)}>
                                <div className="flex flex-col gap-2 p-2">
                                    <div className="text-foreground flex items-start justify-between text-sm font-bold">
                                        <div className="flex max-w-[65%] flex-col">
                                            <span className="text-primary flex items-center gap-1.5 truncate font-bold">
                                                <UserIcon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">{order.buyer || order.buyerName || "Buyer"}</span>
                                            </span>
                                            <span className="text-muted-foreground mt-0.5 flex items-center gap-1 font-mono text-[10px]">
                                                <CalendarIcon className="h-3 w-3" />
                                                {order.createdDate || order.raw?.createdDate ? new Date(order.createdDate || order.raw.createdDate).toLocaleString() : "-"}
                                            </span>
                                        </div>
                                        <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                                            <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${order.status === "Completed" ? "border-success/30 bg-success/20 text-success border" : order.status === "Delivered" ? "border-accent/30 bg-accent/20 text-accent border" : order.status === "Paid" ? "border-warning/30 bg-warning/20 text-warning border" : order.status === "Canceled" || order.status === "Canceled" ? "border-danger/30 bg-danger/20 text-danger border" : "border-border bg-surface-3 text-foreground/85 border"}`}>
                                                {getStatusIcon(order.status, "w-3 h-3")}
                                                {order.status || "Unknown"}
                                            </span>
                                            {order.raw?.deliveryTime && ["Delivered", "Received", "Completed"].includes(order.status) && (
                                                <p className="border-border/50 bg-surface-3/50 text-muted-foreground flex items-center gap-1 rounded border px-1 py-0.5 font-mono text-[9px]">
                                                    <TimerIcon className="h-2.5 w-2.5" />
                                                    {formatDeliveryTime(order.raw.deliveryTime)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="border-border/50 bg-surface-1/50 flex items-center justify-between rounded border p-1.5">
                                            <div className="text-foreground/85 flex items-center gap-2 truncate text-sm font-medium">
                                                {order.raw?.orderOfferDetails?.mainOfferImage?.smallImage ? <img src={`https://assetsdelivery.eldorado.gg/v7/_offers-v2_/${order.raw.orderOfferDetails.mainOfferImage.smallImage}`} alt="Item" className="h-6 w-6 shrink-0 rounded object-cover" /> : <Gamepad2Icon className="text-muted-foreground h-4 w-4 shrink-0" />}
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button type="button" className="hover:text-foreground flex cursor-pointer flex-col truncate text-left transition-colors" title={order.game || order.gameName} onClick={(e) => e.stopPropagation()}>
                                                            <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                                                                {(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${order.raw?.orderOfferDetails?.gameId || order.raw?.gameId}.png`} alt="Game" className="h-3.5 w-3.5 rounded-sm object-cover opacity-90" />}
                                                                {getGameName(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) || "Game"}
                                                            </span>
                                                            <span className="truncate">{order.game || order.gameName || "Item"}</span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="border-border bg-surface-2 z-50 flex w-auto flex-col gap-2 p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold uppercase">
                                                                {(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) && <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${order.raw?.orderOfferDetails?.gameId || order.raw?.gameId}.png`} alt="Game" className="h-4 w-4 rounded-sm object-cover opacity-90" />}
                                                                {getGameName(order.raw?.orderOfferDetails?.gameId || order.raw?.gameId) || "Game"}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-foreground max-w-xs text-sm font-medium break-all">{order.game || order.gameName || "Item"}</span>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="text-muted-foreground hover:text-foreground h-6 w-6 shrink-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigator.clipboard.writeText(order.game || order.gameName || "Item");
                                                                        // toast.success("Nama item dicopy");
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
                                                        // toast.success("Username Roblox dicopy");
                                                    }}
                                                    className="text-accent bg-accent/10 hover:bg-accent/20 border-accent/20 flex cursor-pointer items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors"
                                                    title="Copy username Roblox"
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
                                            <div className="border-border/40 bg-surface-1/60 flex items-center gap-2 rounded-lg border px-2 py-1.5">
                                                <MessageSquareIcon className="text-muted-foreground h-3 w-3 shrink-0" />
                                                <p className="text-muted-foreground min-w-0 flex-1 truncate text-[11px]">{chatPreview.lastMessage}</p>
                                                {chatPreview.timestamp > 0 && <span className="text-muted-foreground shrink-0 text-[10px] font-medium">{timeAgo(chatPreview.timestamp)}</span>}
                                                {chatPreview.unreadCount > 0 && <span className="bg-success h-2.5 w-2.5 shrink-0 animate-pulse rounded-full shadow-[0_0_8px_rgb(52_211_153_/_0.7)]"></span>}
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
                    <div className="text-muted-foreground flex items-center justify-center py-4">
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> <span className="text-xs">Ngambil lagi...</span>
                    </div>
                )}
                {!hasNextPage && activeOrderList.length > 0 && !isLoadingOrders && <div className="text-muted-foreground/70 py-3 text-center font-mono text-[10px] tracking-widest uppercase">--- Mentok Bos ---</div>}
            </div>
        </div>
    );
}
