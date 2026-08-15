"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    getEldoradoOffers,
    pauseEldoradoOffer,
    resumeEldoradoOffer,
    deleteEldoradoOffer,
    updateEldoradoOfferPrice,
    updateEldoradoOfferDetails,
    updateEldoradoDeliveryTime,
    bulkPauseEldoradoOffers,
    bulkDeleteEldoradoOffers,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    SearchIcon,
    FilterIcon,
    PackageIcon,
    Gamepad2Icon,
    ClockIcon,
    DollarSign,
    PlayCircleIcon,
    InfoIcon,
    HistoryIcon,
    PencilIcon,
    Trash2Icon,
    PauseCircleIcon,
    PlusIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowUpDownIcon,
    XIcon,
    CheckIcon,
    Loader2Icon,
    TagIcon,
    LayersIcon,
    TrendingUpIcon,
    ShoppingCartIcon,
    ImageIcon,
    GlobeIcon,
    CalendarIcon,
    HashIcon,
    PercentIcon,
    SlidersHorizontalIcon,
    ChevronDownIcon,
    PauseIcon,
    RefreshCwIcon,
} from "lucide-react";

// === Constants ===
const DELIVERY_TIME_OPTIONS = [
    { value: "", label: "Semua" },
    { value: "Instant", label: "Instant" },
    { value: "Automated", label: "Automated" },
    { value: "Minute5", label: "5 Menit" },
    { value: "Minute20", label: "20 Menit" },
    { value: "Hour1", label: "1 Jam" },
    { value: "Hour2", label: "2 Jam" },
    { value: "Hour3", label: "3 Jam" },
    { value: "Hour5", label: "5 Jam" },
    { value: "Hour8", label: "8 Jam" },
    { value: "Hour12", label: "12 Jam" },
    { value: "Day1", label: "1 Hari" },
    { value: "Day2", label: "2 Hari" },
    { value: "Day3", label: "3 Hari" },
    { value: "Day7", label: "7 Hari" },
    { value: "Day14", label: "14 Hari" },
    { value: "Day28", label: "28 Hari" },
    { value: "Day45", label: "45 Hari" },
    { value: "Day60", label: "60 Hari" },
    { value: "NotApplicable", label: "N/A" },
];

const CATEGORY_OPTIONS = [
    { value: "", label: "Semua" },
    { value: "Account", label: "Account" },
    { value: "Currency", label: "Currency" },
    { value: "CustomItem", label: "Custom Item" },
    { value: "Boosting", label: "Boosting" },
    { value: "RequestedBoosting", label: "Requested Boosting" },
    { value: "ManagedBoosting", label: "Managed Boosting" },
    { value: "TopUp", label: "Top Up" },
    { value: "GiftCard", label: "Gift Card" },
];

const STATE_OPTIONS = [
    { value: "", label: "Semua" },
    { value: "Active", label: "Active" },
    { value: "Paused", label: "Paused" },
    { value: "Closed", label: "Closed" },
    { value: "Offline", label: "Offline" },
];

const SORT_OPTIONS = [
    { value: "", label: "Default" },
    { value: "Price", label: "Harga" },
    { value: "Date", label: "Tanggal" },
    { value: "DeliveryTime", label: "Delivery Time" },
];

const formatDeliveryTime = (dt) => {
    const found = DELIVERY_TIME_OPTIONS.find((o) => o.value === dt);
    return found ? found.label : dt || "-";
};

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
        return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
        return dateStr;
    }
};

const formatCurrency = (amount, currency = "USD") => {
    if (amount === undefined || amount === null) return "-";
    return `$${Number(amount).toFixed(2)}`;
};

const getStateBadgeClass = (state) => {
    switch (state) {
        case "Active":
            return "border-emerald-500/30 bg-emerald-500/15 text-emerald-400";
        case "Paused":
            return "border-amber-500/30 bg-amber-500/15 text-amber-400";
        case "Closed":
            return "border-red-500/30 bg-red-500/15 text-red-400";
        case "Offline":
            return "border-zinc-600/30 bg-zinc-600/15 text-zinc-400";
        default:
            return "border-zinc-700 bg-zinc-800 text-zinc-300";
    }
};

// === Sub-Components ===

const DetailSection = ({ title, icon, children, className = "" }) => (
    <div className={`group/section relative mb-4 rounded-2xl border border-white/[0.04] bg-zinc-950/50 p-4 shadow-lg sm:p-5 ${className}`}>
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/section:opacity-100"></div>
        <div className="relative z-10 mb-3 flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-xl p-2 shadow-[0_0_15px_rgba(248,28,229,0.1)] transition-all">{icon}</div>
            <h3 className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-sm font-bold tracking-tight text-transparent">{title}</h3>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </div>
);

const DetailItem = ({ label, value, valueClass = "text-zinc-200", icon, colSpan = false }) => (
    <div className={`group/item flex flex-col gap-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5 transition-colors hover:bg-zinc-800/50 ${colSpan ? "sm:col-span-2" : ""}`}>
        <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
            <div className="group-hover/item:text-primary text-zinc-500 transition-colors">{icon}</div>
            {label}
        </span>
        <span className={`text-xs font-semibold ${valueClass} break-all`} title={typeof value === "string" ? value : ""}>
            {value !== undefined && value !== null && value !== "" ? value : "-"}
        </span>
    </div>
);

const EditableField = ({ label, value, icon, onSave, type = "text", isLoading = false }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    useEffect(() => setEditValue(value), [value]);

    const handleSave = async () => {
        await onSave(editValue);
        setEditing(false);
    };

    return (
        <div className="group/item relative flex flex-col gap-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5 transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/50">
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                    <div className="group-hover/item:text-primary text-zinc-500 transition-colors">{icon}</div>
                    {label}
                </span>
                {!editing && (
                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 transition-opacity group-hover/item:opacity-100" onClick={() => setEditing(true)}>
                        <PencilIcon className="hover:text-accent h-3 w-3 text-zinc-400" />
                    </Button>
                )}
            </div>
            {editing ? (
                <div className="flex items-center gap-1.5">
                    <input
                        type={type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="focus:border-primary/50 h-7 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-400 hover:text-emerald-300" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-zinc-300" onClick={() => { setEditing(false); setEditValue(value); }}>
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>
            ) : (
                <span className="text-accent text-sm font-bold">{type === "number" ? formatCurrency(value) : value || "-"}</span>
            )}
        </div>
    );
};

const SelectFilter = ({ value, onChange, options, icon, className = "" }) => (
    <div className={`relative shrink-0 ${className}`}>
        {icon && <div className="pointer-events-none absolute top-2 left-2 z-10 text-zinc-500">{icon}</div>}
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`focus:border-primary/50 h-8 w-full cursor-pointer appearance-none rounded-lg border border-zinc-800 bg-zinc-950/80 ${icon ? "pl-7" : "pl-2.5"} pr-6 text-xs text-zinc-200 transition-colors focus:outline-none`}
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-2.5 right-1.5 h-3 w-3 text-zinc-500" />
    </div>
);

const OfferCardSkeleton = () => (
    <Card className="border-zinc-800 bg-zinc-900/40 p-2.5">
        <div className="mb-2 flex items-start justify-between">
            <div className="flex w-2/3 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                <Skeleton className="h-3 w-1/3 bg-zinc-800" />
            </div>
            <div className="flex w-1/4 flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-full bg-zinc-800" />
                <Skeleton className="h-4 w-2/3 bg-zinc-800" />
            </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-zinc-800/50 pt-2">
            <Skeleton className="h-3 w-1/2 bg-zinc-800" />
            <Skeleton className="h-4 w-1/4 bg-zinc-800" />
        </div>
    </Card>
);

// === Main Page ===

export default function OffersPage() {
    // Data state
    const [offers, setOffers] = useState([]);
    const [activeOfferId, setActiveOfferId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [recordCount, setRecordCount] = useState(0);
    const [pageSize] = useState(20);

    // Filters
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [offerStateFilter, setOfferStateFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [deliveryTimeFilter, setDeliveryTimeFilter] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [sortAsc, setSortAsc] = useState("");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Action loading states
    const [actionLoading, setActionLoading] = useState(null); // offerId or "bulk"
    const [priceLoading, setPriceLoading] = useState(false);

    // Edit delivery time dialog
    const [editDeliveryOpen, setEditDeliveryOpen] = useState(false);
    const [editDeliveryValue, setEditDeliveryValue] = useState("");

    const offerList = Array.isArray(offers) ? offers : [];
    const activeOffer = offerList.find((o) => o.id === activeOfferId) || null;

    const fetchOffers = useCallback(async () => {
        setIsLoading(true);
        setApiError(null);
        const res = await getEldoradoOffers({
            query: searchQuery,
            offerState: offerStateFilter,
            category: categoryFilter,
            deliveryTime: deliveryTimeFilter,
            pageIndex,
            pageSize,
            offerSortingCriterion: sortBy,
            isAscending: sortAsc,
        });
        setIsLoading(false);

        if (res.success) {
            setOffers(res.data);
            setTotalPages(res.totalPages || 0);
            setRecordCount(res.recordCount || 0);
            if (res.data.length > 0 && !activeOfferId) {
                setActiveOfferId(res.data[0].id);
            }
        } else {
            setApiError(res.error);
            toast.error("Gagal narik offers: " + res.error);
        }
    }, [searchQuery, offerStateFilter, categoryFilter, deliveryTimeFilter, pageIndex, pageSize, sortBy, sortAsc]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPageIndex(0);
        setSearchQuery(searchInput);
    };

    // === Actions ===
    const handlePauseResume = async (offer) => {
        const action = offer.offerState === "Active" ? "pause" : "resume";
        setActionLoading(offer.id);
        const res = action === "pause" ? await pauseEldoradoOffer(offer.id) : await resumeEldoradoOffer(offer.id);
        setActionLoading(null);

        if (res.success) {
            toast.success(`Offer berhasil di-${action}!`);
            fetchOffers();
        } else {
            toast.error(`Gagal ${action}: ${res.error}`);
        }
    };

    const handleDelete = async (offerId) => {
        setActionLoading(offerId);
        const res = await deleteEldoradoOffer(offerId);
        setActionLoading(null);

        if (res.success) {
            toast.success("Offer berhasil dihapus!");
            if (activeOfferId === offerId) setActiveOfferId(null);
            fetchOffers();
        } else {
            toast.error("Gagal hapus: " + res.error);
        }
    };

    const handleUpdatePrice = async (offerId, newAmount) => {
        setPriceLoading(true);
        const res = await updateEldoradoOfferPrice(offerId, { amount: parseFloat(newAmount), currency: "USD" });
        setPriceLoading(false);

        if (res.success) {
            toast.success("Harga berhasil diupdate!");
            fetchOffers();
        } else {
            toast.error("Gagal update harga: " + res.error);
        }
    };

    const handleUpdateDeliveryTime = async (offerId, newDeliveryTime) => {
        setActionLoading(offerId);
        const res = await updateEldoradoOfferDetails(offerId, {
            details: {
                guaranteedDeliveryTime: newDeliveryTime,
            },
        });
        setActionLoading(null);

        if (res.success) {
            toast.success("Delivery time berhasil diupdate!");
            setEditDeliveryOpen(false);
            fetchOffers();
        } else {
            toast.error("Gagal update delivery time: " + res.error);
        }
    };

    const handleBulkPause = async () => {
        setActionLoading("bulk");
        const body = {};
        if (categoryFilter) body.category = categoryFilter;
        if (offerStateFilter) body.offerState = offerStateFilter;
        const res = await bulkPauseEldoradoOffers(body);
        setActionLoading(null);

        if (res.success) {
            toast.success(`Bulk pause berhasil! ${res.data?.bulkActionOffersCount || ""} offers di-pause.`);
            fetchOffers();
        } else {
            toast.error("Bulk pause gagal: " + res.error);
        }
    };

    const handleBulkDelete = async () => {
        setActionLoading("bulk");
        const params = {};
        if (offerStateFilter) params.offerState = offerStateFilter;
        if (categoryFilter) params.category = categoryFilter;
        const res = await bulkDeleteEldoradoOffers(params);
        setActionLoading(null);

        if (res.success) {
            toast.success("Bulk delete berhasil!");
            setActiveOfferId(null);
            fetchOffers();
        } else {
            toast.error("Bulk delete gagal: " + res.error);
        }
    };

    const resetFilters = () => {
        setSearchInput("");
        setSearchQuery("");
        setOfferStateFilter("");
        setCategoryFilter("");
        setDeliveryTimeFilter("");
        setSortBy("");
        setSortAsc("");
        setPageIndex(0);
    };

    const hasActiveFilters = searchQuery || offerStateFilter || categoryFilter || deliveryTimeFilter || sortBy;

    return (
        <div className="text-foreground min-h-screen bg-black p-4 pb-20 md:p-8">
            <div className="mx-auto flex h-[85vh] w-full max-w-7xl flex-col gap-5 md:flex-row">
                {/* ===== LEFT PANEL — Offer List ===== */}
                <div className="flex h-full w-full shrink-0 flex-col gap-3 md:w-[380px]">
                    {/* Header + Filters */}
                    <div className="relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md">
                        <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-br to-transparent"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h1 className="neon-text-primary text-lg font-bold tracking-widest uppercase">Listingan Offers</h1>
                                {!isLoading && <p className="mt-0.5 text-[10px] text-zinc-500">{recordCount} total offers</p>}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} title="Advanced Filters">
                                    <SlidersHorizontalIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={fetchOffers} title="Refresh">
                                    <RefreshCwIcon className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Search + State Filter */}
                        <div className="relative z-10 flex gap-2">
                            <form onSubmit={handleSearchSubmit} className="relative flex-1">
                                <SearchIcon className="absolute top-2 left-2.5 h-4 w-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Cari offer..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="focus:border-primary/50 h-8 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pr-3 pl-8 text-xs text-zinc-200 transition-colors placeholder:text-zinc-600 focus:outline-none"
                                />
                            </form>
                            <SelectFilter value={offerStateFilter} onChange={(v) => { setOfferStateFilter(v); setPageIndex(0); }} options={STATE_OPTIONS} icon={<FilterIcon className="h-3 w-3" />} className="w-[100px]" />
                        </div>

                        {/* Advanced Filters */}
                        {showAdvancedFilters && (
                            <div className="relative z-10 flex flex-col gap-2 border-t border-zinc-800/50 pt-3">
                                <div className="flex gap-2">
                                    <SelectFilter value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPageIndex(0); }} options={CATEGORY_OPTIONS} icon={<TagIcon className="h-3 w-3" />} className="flex-1" />
                                    <SelectFilter value={deliveryTimeFilter} onChange={(v) => { setDeliveryTimeFilter(v); setPageIndex(0); }} options={DELIVERY_TIME_OPTIONS} icon={<ClockIcon className="h-3 w-3" />} className="flex-1" />
                                </div>
                                <div className="flex gap-2">
                                    <SelectFilter value={sortBy} onChange={(v) => { setSortBy(v); setPageIndex(0); }} options={SORT_OPTIONS} icon={<ArrowUpDownIcon className="h-3 w-3" />} className="flex-1" />
                                    <SelectFilter
                                        value={sortAsc}
                                        onChange={(v) => { setSortAsc(v); setPageIndex(0); }}
                                        options={[
                                            { value: "", label: "Order" },
                                            { value: "true", label: "Ascending" },
                                            { value: "false", label: "Descending" },
                                        ]}
                                        className="w-[100px]"
                                    />
                                </div>
                                {hasActiveFilters && (
                                    <button onClick={resetFilters} className="flex items-center gap-1 self-start text-[10px] text-zinc-500 transition-colors hover:text-zinc-300">
                                        <XIcon className="h-3 w-3" /> Reset filters
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Bulk Actions */}
                        {offerList.length > 0 && (
                            <div className="relative z-10 flex gap-1.5 border-t border-zinc-800/30 pt-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 flex-1 gap-1 text-[10px] text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                                    onClick={handleBulkPause}
                                    disabled={actionLoading === "bulk"}
                                >
                                    {actionLoading === "bulk" ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <PauseIcon className="h-3 w-3" />}
                                    Pause All
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-6 flex-1 gap-1 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                            <Trash2Icon className="h-3 w-3" /> Delete All
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="text-foreground border-zinc-800 bg-zinc-950">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-xl">Bulk Delete Offers?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-zinc-400">
                                                Semua offers yang sesuai filter bakal dihapus. <span className="font-bold text-red-400">Ini ga bisa di-undo!</span>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-4">
                                            <AlertDialogCancel className="border-zinc-700 bg-zinc-900 text-zinc-300">Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 font-bold text-white hover:bg-red-600">Ya, Hapus Semua!</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>

                    {/* Offer List */}
                    <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-1">
                        {isLoading ? (
                            <div className="flex flex-col gap-2">
                                {[...Array(6)].map((_, i) => <OfferCardSkeleton key={i} />)}
                            </div>
                        ) : apiError ? (
                            <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                                {apiError}
                                <p className="mt-2 text-xs opacity-70">Pastiin ELDORADO_ID_TOKEN bener bro!</p>
                            </div>
                        ) : offerList.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center">
                                <PackageIcon className="h-10 w-10 text-zinc-700" />
                                <p className="text-sm text-zinc-500">Gak ada offer yang ketemu.</p>
                                {hasActiveFilters && (
                                    <button onClick={resetFilters} className="text-primary text-xs hover:underline">Reset filters</button>
                                )}
                            </div>
                        ) : (
                            offerList.map((offer) => (
                                <Card
                                    key={offer.id}
                                    className={`cursor-pointer border transition-all duration-200 ${
                                        activeOfferId === offer.id
                                            ? "border-primary/50 bg-zinc-800/80 shadow-[0_0_15px_rgba(248,28,229,0.08)]"
                                            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40"
                                    }`}
                                    onClick={() => setActiveOfferId(offer.id)}
                                >
                                    <CardHeader className="p-2.5 pb-1">
                                        <CardTitle className="flex items-start justify-between text-sm font-bold text-zinc-200">
                                            <div className="flex max-w-[60%] flex-col gap-1">
                                                <span className="text-primary flex items-center gap-2 truncate text-xs font-bold">
                                                    <PackageIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                                    <span className="truncate">{offer.offerTitle}</span>
                                                </span>
                                                <span className="truncate pl-5 font-mono text-[9px] text-zinc-600">
                                                    {offer.id?.substring(0, 8)}...
                                                </span>
                                            </div>
                                            <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                                                <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${getStateBadgeClass(offer.offerState)}`}>
                                                    {offer.offerState}
                                                </span>
                                                <span className="text-accent text-xs font-bold">{formatCurrency(offer.pricePerUnit?.amount)}</span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-1 p-2.5 pt-0">
                                        <div className="flex items-center justify-between rounded-md border border-zinc-800/50 bg-zinc-950/50 p-1.5">
                                            <p className="flex items-center gap-1.5 truncate text-[10px] font-medium text-zinc-400">
                                                <Gamepad2Icon className="h-3 w-3 shrink-0 text-zinc-600" />
                                                <span className="truncate">{offer.gameCategoryTitle}</span>
                                                <span className="text-zinc-600">·</span>
                                                <span className="text-zinc-500">{offer.category}</span>
                                            </p>
                                            <div className="ml-2 flex shrink-0 items-center gap-2">
                                                <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                                                    <ClockIcon className="h-2.5 w-2.5" />{formatDeliveryTime(offer.guaranteedDeliveryTime)}
                                                </span>
                                                <span className="bg-primary/15 text-primary rounded px-1.5 py-0.5 text-[9px] font-bold">
                                                    ×{offer.quantity}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex shrink-0 items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                            <span className="text-[10px] text-zinc-500">
                                Hal {pageIndex + 1} / {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))}>
                                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex((p) => p + 1)}>
                                    <ChevronRightIcon className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== RIGHT PANEL — Detail ===== */}
                <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
                    {!activeOffer ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-500">
                            <InfoIcon className="h-8 w-8 text-zinc-700" />
                            <p className="text-sm">Pilih offer di sebelah kiri buat lihat detail.</p>
                        </div>
                    ) : (
                        <div className="relative flex h-full flex-1 flex-col">
                            <div className="absolute inset-0 z-0 bg-black/80"></div>

                            <div className="relative z-10 flex h-full flex-col">
                                {/* Fixed Header */}
                                <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-zinc-800/50 bg-black/40 px-5 py-4 shadow-lg backdrop-blur-xl">
                                    <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-r via-transparent to-transparent opacity-40"></div>
                                    <div className="relative z-10 flex-1 overflow-hidden">
                                        <h1 className="flex items-center gap-2.5 text-lg font-bold text-white">
                                            <div className="bg-primary/20 border-primary/30 shrink-0 rounded-lg border p-1.5 shadow-[0_0_15px_rgba(248,28,229,0.2)]">
                                                <PackageIcon className="text-primary h-4 w-4" />
                                            </div>
                                            <span className="truncate">{activeOffer.offerTitle}</span>
                                        </h1>
                                        <div className="mt-1 flex items-center gap-2 pl-9">
                                            <span className="font-mono text-[10px] text-zinc-600">{activeOffer.id}</span>
                                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${getStateBadgeClass(activeOffer.offerState)}`}>
                                                {activeOffer.offerState}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 ml-3 flex shrink-0 gap-2">
                                        <Button
                                            onClick={() => handlePauseResume(activeOffer)}
                                            variant="outline"
                                            size="sm"
                                            className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:text-white"
                                            disabled={actionLoading === activeOffer.id}
                                        >
                                            {actionLoading === activeOffer.id ? (
                                                <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            ) : activeOffer.offerState === "Active" ? (
                                                <PauseCircleIcon className="mr-1.5 h-3.5 w-3.5" />
                                            ) : (
                                                <PlayCircleIcon className="mr-1.5 h-3.5 w-3.5" />
                                            )}
                                            {activeOffer.offerState === "Active" ? "Pause" : "Resume"}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                                    <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="text-foreground border-zinc-800 bg-zinc-950">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-xl">Yakin hapus offer ini?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-zinc-400">
                                                        Offer <span className="font-mono text-white">{activeOffer.id?.substring(0, 8)}...</span> bakal ilang dari Eldorado. <span className="text-red-400">Ga bisa di-undo bro.</span>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="mt-4">
                                                    <AlertDialogCancel className="border-zinc-700 bg-zinc-900 text-zinc-300">Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(activeOffer.id)} className="bg-red-500 font-bold text-white hover:bg-red-600">Ya, Hapus!</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
                                    <div className="mx-auto max-w-4xl space-y-1">
                                        {/* 1. Overview */}
                                        <DetailSection title="Overview" icon={<InfoIcon className="text-primary h-4 w-4" />}>
                                            <DetailItem label="Title" value={activeOffer.offerTitle} icon={<PackageIcon className="h-3 w-3" />} colSpan />
                                            <DetailItem label="Category" value={activeOffer.category} icon={<TagIcon className="h-3 w-3" />} />
                                            <DetailItem label="Game" value={activeOffer.gameCategoryTitle} icon={<Gamepad2Icon className="h-3 w-3" />} />
                                            <DetailItem label="Status" value={activeOffer.offerState} valueClass={activeOffer.offerState === "Active" ? "text-emerald-400" : activeOffer.offerState === "Paused" ? "text-amber-400" : "text-zinc-400"} icon={<PlayCircleIcon className="h-3 w-3" />} />
                                            <DetailItem label="Game SEO Alias" value={activeOffer.gameSeoAlias} icon={<GlobeIcon className="h-3 w-3" />} />
                                            <DetailItem label="Description" value={activeOffer.description} icon={<InfoIcon className="h-3 w-3" />} colSpan />
                                            <DetailItem label="Expire Date" value={formatDate(activeOffer.expireDate)} icon={<CalendarIcon className="h-3 w-3" />} />
                                            <DetailItem label="Offer Version" value={activeOffer.offerVersion} icon={<HashIcon className="h-3 w-3" />} />
                                            <DetailItem label="Is Product" value={activeOffer.isProduct ? "Yes" : "No"} icon={<PackageIcon className="h-3 w-3" />} />
                                            <DetailItem label="Product Key" value={activeOffer.standardizedProductKey} icon={<HashIcon className="h-3 w-3" />} />
                                        </DetailSection>

                                        {/* 2. Pricing */}
                                        <DetailSection title="Pricing" icon={<DollarSign className="text-primary h-4 w-4" />}>
                                            <EditableField
                                                label="Price Per Unit"
                                                value={activeOffer.pricePerUnit?.amount}
                                                icon={<DollarSign className="h-3 w-3" />}
                                                type="number"
                                                isLoading={priceLoading}
                                                onSave={(v) => handleUpdatePrice(activeOffer.id, v)}
                                            />
                                            <DetailItem
                                                label="Price w/ Discount"
                                                value={formatCurrency(activeOffer.pricePerUnitWithDiscount?.amount)}
                                                icon={<PercentIcon className="h-3 w-3" />}
                                                valueClass="text-emerald-400"
                                            />
                                            <DetailItem label="Price in USD" value={formatCurrency(activeOffer.pricePerUnitInUSD?.amount)} icon={<DollarSign className="h-3 w-3" />} />
                                            <DetailItem label="Discount %" value={activeOffer.discountPercentage ? `${activeOffer.discountPercentage}%` : "0%"} icon={<PercentIcon className="h-3 w-3" />} valueClass="text-amber-400" />
                                            <DetailItem label="Min Purchase Price" value={formatCurrency(activeOffer.minPurchasePrice?.amount)} icon={<DollarSign className="h-3 w-3" />} />
                                            <DetailItem
                                                label="Exchange Rate"
                                                value={activeOffer.exchangeRate ? `${activeOffer.exchangeRate.currency} × ${activeOffer.exchangeRate.exchangeRate}` : "-"}
                                                icon={<TrendingUpIcon className="h-3 w-3" />}
                                            />
                                            {activeOffer.volumeDiscounts?.length > 0 && (
                                                <div className="sm:col-span-2">
                                                    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5">
                                                        <span className="mb-2 flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                                                            <LayersIcon className="h-3 w-3" /> Volume Discounts
                                                        </span>
                                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                            {activeOffer.volumeDiscounts.map((vd, i) => (
                                                                <span key={i} className="rounded border border-zinc-700/50 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-300">
                                                                    {vd.quantity}+ → <span className="text-emerald-400">{vd.percentage}%</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </DetailSection>

                                        {/* 3. Inventory & Delivery */}
                                        <DetailSection title="Inventory & Delivery" icon={<ClockIcon className="text-primary h-4 w-4" />}>
                                            <DetailItem label="Quantity" value={activeOffer.quantity} icon={<PackageIcon className="h-3 w-3" />} />
                                            <DetailItem label="Min Quantity" value={activeOffer.minQuantity} icon={<PackageIcon className="h-3 w-3" />} />
                                            <DetailItem label="Max Purchase Qty" value={activeOffer.maxPurchaseQuantity} icon={<ShoppingCartIcon className="h-3 w-3" />} />

                                            {/* Delivery Time — Editable via select */}
                                            <div className="group/item relative flex flex-col gap-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5 transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/50">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                                                        <ClockIcon className="group-hover/item:text-primary h-3 w-3 text-zinc-500 transition-colors" />
                                                        Delivery Time
                                                    </span>
                                                    {!editDeliveryOpen && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-5 w-5 opacity-0 transition-opacity group-hover/item:opacity-100"
                                                            onClick={() => { setEditDeliveryOpen(true); setEditDeliveryValue(activeOffer.guaranteedDeliveryTime); }}
                                                        >
                                                            <PencilIcon className="hover:text-accent h-3 w-3 text-zinc-400" />
                                                        </Button>
                                                    )}
                                                </div>
                                                {editDeliveryOpen ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <select
                                                            value={editDeliveryValue}
                                                            onChange={(e) => setEditDeliveryValue(e.target.value)}
                                                            className="focus:border-primary/50 h-7 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200 focus:outline-none"
                                                        >
                                                            {DELIVERY_TIME_OPTIONS.filter(o => o.value).map((o) => (
                                                                <option key={o.value} value={o.value}>{o.label}</option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 text-emerald-400 hover:text-emerald-300"
                                                            onClick={() => handleUpdateDeliveryTime(activeOffer.id, editDeliveryValue)}
                                                            disabled={actionLoading === activeOffer.id}
                                                        >
                                                            {actionLoading === activeOffer.id ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-zinc-300" onClick={() => setEditDeliveryOpen(false)}>
                                                            <XIcon className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-semibold text-zinc-200">{formatDeliveryTime(activeOffer.guaranteedDeliveryTime)}</span>
                                                )}
                                            </div>
                                        </DetailSection>

                                        {/* 4. Order Stats */}
                                        <DetailSection title="Order Stats" icon={<ShoppingCartIcon className="text-primary h-4 w-4" />}>
                                            <DetailItem label="Orders (24h)" value={activeOffer.orderCounts?.last24Hours} icon={<HistoryIcon className="h-3 w-3" />} valueClass="text-accent" />
                                            <DetailItem label="Orders (30d)" value={activeOffer.orderCounts?.last30Days} icon={<HistoryIcon className="h-3 w-3" />} valueClass="text-accent" />
                                            <DetailItem label="Orders (All Time)" value={activeOffer.orderCounts?.allTime} icon={<HistoryIcon className="h-3 w-3" />} valueClass="text-accent" />
                                        </DetailSection>

                                        {/* 5. Trade Environment */}
                                        {activeOffer.tradeEnvironmentValues?.length > 0 && (
                                            <DetailSection title="Trade Environment" icon={<GlobeIcon className="text-primary h-4 w-4" />}>
                                                {activeOffer.tradeEnvironmentValues.map((tev, i) => (
                                                    <DetailItem key={i} label={tev.name || `Env ${i + 1}`} value={tev.value} icon={<GlobeIcon className="h-3 w-3" />} />
                                                ))}
                                            </DetailSection>
                                        )}

                                        {/* 6. Offer Attributes */}
                                        {activeOffer.offerAttributeIdValues?.length > 0 && (
                                            <DetailSection title="Offer Attributes" icon={<LayersIcon className="text-primary h-4 w-4" />}>
                                                {activeOffer.offerAttributeIdValues.map((attr, i) => (
                                                    <DetailItem key={i} label={attr.name || `Attr ${i + 1}`} value={attr.value} icon={<TagIcon className="h-3 w-3" />} />
                                                ))}
                                            </DetailSection>
                                        )}

                                        {/* 7. Attribute Definitions */}
                                        {activeOffer.attributes?.length > 0 && (
                                            <DetailSection title="Attribute Definitions" icon={<SlidersHorizontalIcon className="text-primary h-4 w-4" />}>
                                                {activeOffer.attributes.map((attr, i) => (
                                                    <div key={i} className="flex flex-col gap-1 rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5">
                                                        <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">{attr.name}</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="rounded border border-zinc-700/50 bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-400">type: {attr.type}</span>
                                                            <span className="rounded border border-zinc-700/50 bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-400">display: {attr.display}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </DetailSection>
                                        )}

                                        {/* 8. Images */}
                                        {(activeOffer.mainOfferImage || activeOffer.offerImages?.length > 0) && (
                                            <DetailSection title="Images" icon={<ImageIcon className="text-primary h-4 w-4" />}>
                                                {activeOffer.mainOfferImage && (
                                                    <DetailItem label="Main Image" value={activeOffer.mainOfferImage.smallImage || activeOffer.mainOfferImage.largeImage || "-"} icon={<ImageIcon className="h-3 w-3" />} colSpan />
                                                )}
                                                {activeOffer.offerImages?.map((img, i) => (
                                                    <DetailItem key={i} label={`Image ${i + 1}`} value={img.smallImage || img.largeImage || "-"} icon={<ImageIcon className="h-3 w-3" />} />
                                                ))}
                                                {activeOffer.productImage && (
                                                    <DetailItem label="Product Image" value={activeOffer.productImage.name} icon={<ImageIcon className="h-3 w-3" />} />
                                                )}
                                            </DetailSection>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
