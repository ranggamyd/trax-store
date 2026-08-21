"use client";

import { ArrowUpDownIcon, CalendarIcon, CheckIcon, CheckSquareIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, DollarSign, FilterIcon, Gamepad2Icon, GlobeIcon, HashIcon, HistoryIcon, ImageIcon, InfoIcon, LayersIcon, Loader2Icon, MinusSquareIcon, PackageIcon, PauseCircleIcon, PauseIcon, PencilIcon, PercentIcon, PlayCircleIcon, RefreshCwIcon, SearchIcon, ShoppingCartIcon, SlidersHorizontalIcon, SquareIcon, TagIcon, Trash2Icon, TrendingUpIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { bulkDeleteEldoradoOffers, bulkPauseEldoradoOffers, deleteEldoradoOffer, getEldoradoOffers, pauseEldoradoOffer, resumeEldoradoOffer, updateEldoradoOfferDetails, updateEldoradoOfferPrice } from "@/app/actions";
import TokenStatusNotice from "@/components/molecules/TokenStatusNotice";
import { PageContainer } from "@/components/templates/PageContainer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useEldoradoLibrary } from "@/contexts/EldoradoLibraryContext";
import { useTokenRecovery } from "@/hooks/useTokenRecovery";
import { cn } from "@/lib/utils";

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

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "-";
    return `$${Number(amount).toFixed(2)}`;
};

const getStateBadgeClass = (state) => {
    switch (state) {
        case "Active":
            return "border-success/30 bg-success/15 text-success";
        case "Paused":
            return "border-warning/30 bg-warning/15 text-warning";
        case "Closed":
            return "border-danger/30 bg-danger/15 text-danger";
        case "Offline":
            return "border-border/30 bg-surface-3/15 text-muted-foreground";
        default:
            return "border-border bg-surface-3 text-foreground/85";
    }
};

// === Sub-Components ===

const DetailSection = ({ title, icon, children, className = "" }) => (
    <div className={`group/section bg-surface-1/50 relative mb-4 rounded-2xl border border-white/[0.04] p-4 shadow-lg sm:p-5 ${className}`}>
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/section:opacity-100"></div>
        <div className="relative z-10 mb-3 flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-xl p-2 shadow-[0_0_15px_rgb(124_92_255_/_0.1)] transition-all">{icon}</div>
            <h3 className="from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-sm font-bold tracking-tight text-transparent">{title}</h3>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </div>
);

const DetailItem = ({ label, value, valueClass = "text-foreground", icon, colSpan = false }) => (
    <div className={`group/item border-border/50 bg-surface-2/40 hover:bg-surface-3/50 flex flex-col gap-1 overflow-hidden rounded-lg border p-2.5 transition-colors ${colSpan ? "sm:col-span-2" : ""}`}>
        <span className="text-muted-foreground flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase">
            <div className="group-hover/item:text-primary text-muted-foreground transition-colors">{icon}</div>
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

    const handleSave = async () => {
        await onSave(editValue);
        setEditing(false);
    };

    return (
        <div className="group/item border-border/50 bg-surface-2/40 hover:border-border/60 hover:bg-surface-3/50 relative flex flex-col gap-1 overflow-hidden rounded-lg border p-2.5 transition-colors">
            <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase">
                    <div className="group-hover/item:text-primary text-muted-foreground transition-colors">{icon}</div>
                    {label}
                </span>
                {!editing && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 opacity-0 transition-opacity group-hover/item:opacity-100"
                        onClick={() => {
                            setEditValue(value);
                            setEditing(true);
                        }}
                    >
                        <PencilIcon className="hover:text-accent text-muted-foreground h-3 w-3" />
                    </Button>
                )}
            </div>
            {editing ? (
                <div className="flex items-center gap-1.5">
                    <input type={type} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="focus:border-primary/50 border-border bg-surface-1 text-foreground h-7 flex-1 rounded border px-2 text-xs focus:outline-none" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSave()} />
                    <Button size="icon" variant="ghost" className="text-success hover:text-success h-6 w-6" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground/85 h-6 w-6"
                        onClick={() => {
                            setEditing(false);
                            setEditValue(value);
                        }}
                    >
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>
            ) : (
                <span className="text-accent text-sm font-bold">{type === "number" ? formatCurrency(value) : value || "-"}</span>
            )}
        </div>
    );
};

const SelectFilter = ({ value, onChange, options, icon, className = "" }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const selectedOption = options.find((o) => o.value === value) || options[0];

    const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                // reset pencarian tiap popover ditutup
                if (!next) setSearch("");
            }}
        >
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className={cn("focus:border-primary/50 border-border bg-surface-1/80 text-foreground hover:bg-surface-2/50 h-8 w-full cursor-pointer justify-between px-2.5 text-xs font-normal transition-colors focus:outline-none", className)}>
                    <span className="flex items-center gap-1.5 truncate">
                        {icon && <span className="text-muted-foreground">{icon}</span>}
                        <span className="truncate">{selectedOption?.label || "Semua"}</span>
                    </span>
                    <ChevronDownIcon className="text-muted-foreground h-3 w-3 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="border-border bg-surface-1 text-foreground flex w-[180px] flex-col gap-1.5 p-1.5 shadow-xl" align="start">
                <div className="relative">
                    <SearchIcon className="text-muted-foreground absolute top-2 left-2 h-3.5 w-3.5" />
                    <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="focus:border-primary/50 placeholder:text-muted-foreground/70 border-border bg-surface-2/50 text-foreground h-7.5 w-full rounded-md border pr-2 pl-7.5 text-xs transition-colors focus:outline-none" />
                </div>
                <div className="custom-scrollbar flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="text-muted-foreground py-3 text-center text-[11px]">Tidak ditemukan</div>
                    ) : (
                        filteredOptions.map((o) => {
                            const isChecked = o.value === value;
                            return (
                                <button
                                    key={o.value}
                                    onClick={() => {
                                        onChange(o.value);
                                        setOpen(false);
                                    }}
                                    className={cn("text-muted-foreground hover:bg-surface-2 hover:text-foreground flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-xs transition-colors", isChecked && "text-primary bg-surface-2 font-medium")}
                                >
                                    <span className="truncate">{o.label}</span>
                                    {isChecked && <CheckIcon className="text-primary h-3 w-3 shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

const OfferCardSkeleton = () => (
    <Card className="border-border bg-surface-2/40 p-2.5">
        <div className="mb-2 flex items-start justify-between">
            <div className="flex w-2/3 flex-col gap-1.5">
                <Skeleton className="bg-surface-3 h-4 w-3/4" />
                <Skeleton className="bg-surface-3 h-3 w-1/3" />
            </div>
            <div className="flex w-1/4 flex-col items-end gap-1.5">
                <Skeleton className="bg-surface-3 h-4 w-full" />
                <Skeleton className="bg-surface-3 h-4 w-2/3" />
            </div>
        </div>
        <div className="border-border/50 mt-2 flex items-center justify-between border-t pt-2">
            <Skeleton className="bg-surface-3 h-3 w-1/2" />
            <Skeleton className="bg-surface-3 h-4 w-1/4" />
        </div>
    </Card>
);

// === Main Page ===

export default function OffersPage() {
    const { getGameName } = useEldoradoLibrary();

    // Data state
    const [offers, setOffers] = useState([]);
    const [activeOfferId, setActiveOfferId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(null);

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [recordCount, setRecordCount] = useState(0);
    const [pageSize] = useState(50);

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

    // Multi-select
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectMode, setSelectMode] = useState(false);

    const offerList = Array.isArray(offers) ? offers : [];
    const activeOffer = offerList.find((o) => o.id === activeOfferId) || null;
    const selectedCount = selectedIds.size;

    // Token recovery: 401 gak langsung jadi error, extension dikasih kesempatan jemput token dulu
    const fetchOffersRef = useRef(null);
    const { tokenStatus, tokenFailure, retryCount, reportTokenExpired, reportTokenOk } = useTokenRecovery(useCallback(() => fetchOffersRef.current?.(), []));

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
            reportTokenOk();
            setOffers(res.data);
            setTotalPages(res.totalPages || 0);
            setRecordCount(res.recordCount || 0);
            // auto-pilih offer pertama cuma kalau belum ada yang kepilih
            if (res.data.length > 0) {
                setActiveOfferId((prev) => prev ?? res.data[0].id);
            }
        } else if (res.error === "TOKEN_EXPIRED_401") {
            reportTokenExpired();
        } else {
            setApiError(res.error);
        }
    }, [searchQuery, offerStateFilter, categoryFilter, deliveryTimeFilter, pageIndex, pageSize, sortBy, sortAsc, reportTokenExpired, reportTokenOk]);

    useEffect(() => {
        fetchOffersRef.current = fetchOffers;
    }, [fetchOffers]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data, loading flag-nya sengaja di-set biar spinner langsung nongol
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
        if (action === "pause") await pauseEldoradoOffer(offer.id);
        else await resumeEldoradoOffer(offer.id);
        setActionLoading(null);

        fetchOffers();
    };

    const handleDelete = async (offerId) => {
        setActionLoading(offerId);
        await deleteEldoradoOffer(offerId);
        setActionLoading(null);

        if (activeOfferId === offerId) setActiveOfferId(null);
        fetchOffers();
    };

    const handleUpdatePrice = async (offerId, newAmount) => {
        setPriceLoading(true);
        await updateEldoradoOfferPrice(offerId, { amount: parseFloat(newAmount), currency: "USD" });
        setPriceLoading(false);

        fetchOffers();
    };

    const handleUpdateDeliveryTime = async (offerId, newDeliveryTime) => {
        setActionLoading(offerId);
        await updateEldoradoOfferDetails(offerId, {
            details: {
                guaranteedDeliveryTime: newDeliveryTime,
            },
        });
        setActionLoading(null);

        setEditDeliveryOpen(false);
        fetchOffers();
    };

    const handleBulkPause = async () => {
        setActionLoading("bulk");
        const body = {};
        if (categoryFilter) body.category = categoryFilter;
        if (offerStateFilter) body.offerState = offerStateFilter;
        await bulkPauseEldoradoOffers(body);
        setActionLoading(null);

        fetchOffers();
    };

    const handleBulkDelete = async () => {
        setActionLoading("bulk");
        const params = {};
        if (offerStateFilter) params.offerState = offerStateFilter;
        if (categoryFilter) params.category = categoryFilter;
        await bulkDeleteEldoradoOffers(params);
        setActionLoading(null);

        setActiveOfferId(null);
        fetchOffers();
    };

    // === Multi-select actions ===
    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        if (!selectMode) setSelectMode(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === offerList.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(offerList.map((o) => o.id)));
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setSelectMode(false);
    };

    const handleSelectedPause = async () => {
        if (selectedIds.size === 0) return;
        setActionLoading("selected");
        let successCount = 0;
        let failCount = 0;
        const promises = [...selectedIds].map(async (id) => {
            const res = await pauseEldoradoOffer(id);
            if (res.success) successCount++;
            else failCount++;
        });
        await Promise.all(promises);
        setActionLoading(null);
        toast.success(`${successCount} offer di-pause${failCount > 0 ? `, ${failCount} gagal` : ""}`);
        clearSelection();
        fetchOffers();
    };

    const handleSelectedResume = async () => {
        if (selectedIds.size === 0) return;
        setActionLoading("selected");
        let successCount = 0;
        let failCount = 0;
        const promises = [...selectedIds].map(async (id) => {
            const res = await resumeEldoradoOffer(id);
            if (res.success) successCount++;
            else failCount++;
        });
        await Promise.all(promises);
        setActionLoading(null);
        toast.success(`${successCount} offer di-resume${failCount > 0 ? `, ${failCount} gagal` : ""}`);
        clearSelection();
        fetchOffers();
    };

    const handleSelectedDelete = async () => {
        if (selectedIds.size === 0) return;
        setActionLoading("selected");
        let successCount = 0;
        let failCount = 0;
        const promises = [...selectedIds].map(async (id) => {
            const res = await deleteEldoradoOffer(id);
            if (res.success) successCount++;
            else failCount++;
        });
        await Promise.all(promises);
        setActionLoading(null);
        toast.success(`${successCount} offer dihapus${failCount > 0 ? `, ${failCount} gagal` : ""}`);
        if (selectedIds.has(activeOfferId)) setActiveOfferId(null);
        clearSelection();
        fetchOffers();
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
        <PageContainer width="wide" innerClassName="flex h-[85vh] w-full flex-col gap-5 md:flex-row">
            {/* ===== LEFT PANEL — Offer List ===== */}
            <div className="flex h-full w-full shrink-0 flex-col gap-3 md:w-[380px]">
                {/* Header + Filters */}
                <div className="border-border bg-surface-2/50 relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border p-4 backdrop-blur-md">
                    <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-br to-transparent"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-glow-primary text-lg font-bold tracking-widest uppercase">Listingan Offers</h1>
                            {!isLoading && <p className="text-muted-foreground mt-0.5 text-[10px]">{recordCount} total offers</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7" onClick={() => setSelectMode(!selectMode)} title={selectMode ? "Exit Select" : "Select Mode"}>
                                {selectMode ? <MinusSquareIcon className="text-primary h-3.5 w-3.5" /> : <CheckSquareIcon className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} title="Advanced Filters">
                                <SlidersHorizontalIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 w-7" onClick={fetchOffers} title="Refresh">
                                <RefreshCwIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    {/* Search + State Filter */}
                    <div className="relative z-10 flex gap-2">
                        <form onSubmit={handleSearchSubmit} className="relative flex-1">
                            <SearchIcon className="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
                            <input type="text" placeholder="Cari offer..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="focus:border-primary/50 border-border bg-surface-1/80 text-foreground placeholder:text-muted-foreground/70 h-8 w-full rounded-lg border pr-3 pl-8 text-xs transition-colors focus:outline-none" />
                        </form>
                        <SelectFilter
                            value={offerStateFilter}
                            onChange={(v) => {
                                setOfferStateFilter(v);
                                setPageIndex(0);
                            }}
                            options={STATE_OPTIONS}
                            icon={<FilterIcon className="h-3 w-3" />}
                            className="w-[100px]"
                        />
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="border-border/50 relative z-10 flex flex-col gap-2 border-t pt-3">
                            <div className="flex gap-2">
                                <SelectFilter
                                    value={categoryFilter}
                                    onChange={(v) => {
                                        setCategoryFilter(v);
                                        setPageIndex(0);
                                    }}
                                    options={CATEGORY_OPTIONS}
                                    icon={<TagIcon className="h-3 w-3" />}
                                    className="flex-1"
                                />
                                <SelectFilter
                                    value={deliveryTimeFilter}
                                    onChange={(v) => {
                                        setDeliveryTimeFilter(v);
                                        setPageIndex(0);
                                    }}
                                    options={DELIVERY_TIME_OPTIONS}
                                    icon={<ClockIcon className="h-3 w-3" />}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <SelectFilter
                                    value={sortBy}
                                    onChange={(v) => {
                                        setSortBy(v);
                                        setPageIndex(0);
                                    }}
                                    options={SORT_OPTIONS}
                                    icon={<ArrowUpDownIcon className="h-3 w-3" />}
                                    className="flex-1"
                                />
                                <SelectFilter
                                    value={sortAsc}
                                    onChange={(v) => {
                                        setSortAsc(v);
                                        setPageIndex(0);
                                    }}
                                    options={[
                                        { value: "", label: "Order" },
                                        { value: "true", label: "Ascending" },
                                        { value: "false", label: "Descending" },
                                    ]}
                                    className="w-[100px]"
                                />
                            </div>
                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="text-muted-foreground hover:text-foreground/85 flex items-center gap-1 self-start text-[10px] transition-colors">
                                    <XIcon className="h-3 w-3" /> Reset filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {offerList.length > 0 && !selectMode && (
                        <div className="border-border/30 relative z-10 flex gap-1.5 border-t pt-2">
                            <Button size="sm" variant="ghost" className="text-warning hover:bg-warning/10 hover:text-warning h-6 flex-1 gap-1 text-[10px]" onClick={handleBulkPause} disabled={actionLoading === "bulk"}>
                                {actionLoading === "bulk" ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <PauseIcon className="h-3 w-3" />}
                                Pause All
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger h-6 flex-1 gap-1 text-[10px]">
                                        <Trash2Icon className="h-3 w-3" /> Delete All
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="text-foreground border-border bg-surface-1">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl">Bulk Delete Offers?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground">
                                            Semua offers yang sesuai filter bakal dihapus. <span className="text-danger font-bold">Ini ga bisa di-undo!</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-4">
                                        <AlertDialogCancel className="border-border bg-surface-2 text-foreground/85">Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete} className="bg-danger text-danger-foreground hover:bg-danger/90 font-bold">
                                            Ya, Hapus Semua!
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}

                    {/* Select Mode Toolbar */}
                    {selectMode && (
                        <div className="border-primary/20 relative z-10 flex flex-col gap-2 border-t pt-2">
                            <div className="flex items-center justify-between">
                                <button onClick={toggleSelectAll} className="text-foreground/85 hover:text-foreground flex items-center gap-1.5 text-[10px] font-medium transition-colors">
                                    {selectedIds.size === offerList.length && offerList.length > 0 ? <CheckSquareIcon className="text-primary h-3.5 w-3.5" /> : <SquareIcon className="h-3.5 w-3.5" />}
                                    {selectedIds.size === offerList.length && offerList.length > 0 ? "Unselect All" : "Select All"}
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">{selectedCount} dipilih</span>
                                    <button onClick={clearSelection} className="text-muted-foreground hover:text-foreground/85 text-[10px]">
                                        <XIcon className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                            {selectedCount > 0 && (
                                <div className="flex gap-1.5">
                                    <Button size="sm" variant="ghost" className="text-warning hover:bg-warning/10 h-6 flex-1 gap-1 text-[10px]" onClick={handleSelectedPause} disabled={actionLoading === "selected"}>
                                        {actionLoading === "selected" ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <PauseCircleIcon className="h-3 w-3" />}
                                        Pause
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-success hover:bg-success/10 h-6 flex-1 gap-1 text-[10px]" onClick={handleSelectedResume} disabled={actionLoading === "selected"}>
                                        {actionLoading === "selected" ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <PlayCircleIcon className="h-3 w-3" />}
                                        Resume
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10 h-6 flex-1 gap-1 text-[10px]">
                                                <Trash2Icon className="h-3 w-3" /> Hapus
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="text-foreground border-border bg-surface-1">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus {selectedCount} offer?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-muted-foreground">
                                                    {selectedCount} offer yang dipilih bakal dihapus permanen. <span className="text-danger font-bold">Ga bisa di-undo!</span>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="border-border bg-surface-2 text-foreground/85">Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleSelectedDelete} className="bg-danger text-danger-foreground hover:bg-danger/90 font-bold">
                                                    Ya, Hapus!
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Offer List */}
                <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="flex flex-col gap-2">
                            {[...Array(6)].map((_, i) => (
                                <OfferCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : tokenStatus !== "ok" && offerList.length === 0 ? (
                        <TokenStatusNotice status={tokenStatus} failure={tokenFailure} retryCount={retryCount} />
                    ) : apiError ? (
                        <div className="border-danger/50 bg-danger-muted/30 text-danger rounded-xl border p-4 text-sm">
                            {apiError}
                            <p className="mt-2 text-xs opacity-70">Coba refresh bentar lagi ya bro.</p>
                        </div>
                    ) : offerList.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                            <PackageIcon className="text-muted-foreground/60 h-10 w-10" />
                            <p className="text-muted-foreground text-sm">Gak ada offer yang ketemu.</p>
                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="text-primary text-xs hover:underline">
                                    Reset filters
                                </button>
                            )}
                        </div>
                    ) : (
                        offerList.map((offer) => {
                            const isSelected = selectedIds.has(offer.id);
                            return (
                                <Card
                                    key={offer.id}
                                    className={`cursor-pointer border transition-all duration-200 ${isSelected ? "border-primary/60 bg-primary/5 shadow-[0_0_15px_rgb(124_92_255_/_0.1)]" : activeOfferId === offer.id ? "border-primary/50 bg-surface-3/80 shadow-[0_0_15px_rgb(124_92_255_/_0.08)]" : "border-border bg-surface-2/40 hover:border-border hover:bg-surface-3/40"}`}
                                    onClick={() => {
                                        if (selectMode) {
                                            setSelectedIds((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(offer.id)) next.delete(offer.id);
                                                else next.add(offer.id);
                                                return next;
                                            });
                                        } else {
                                            setActiveOfferId(offer.id);
                                        }
                                    }}
                                >
                                    <CardHeader className="p-2.5 pb-1">
                                        <CardTitle className="text-foreground flex min-w-0 items-start justify-between gap-2 text-sm font-bold">
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                {selectMode ? (
                                                    <button onClick={(e) => toggleSelect(offer.id, e)} className="shrink-0">
                                                        {isSelected ? <CheckSquareIcon className="text-primary h-4 w-4" /> : <SquareIcon className="text-muted-foreground h-4 w-4" />}
                                                    </button>
                                                ) : offer.mainOfferImage?.smallImage ? (
                                                    <img src={`https://fileserviceusprod.blob.core.windows.net/offerimages/${offer.mainOfferImage.smallImage}`} alt="Offer" className="border-border h-10 w-10 shrink-0 rounded-md border object-cover" />
                                                ) : (
                                                    <PackageIcon className="text-muted-foreground h-8 w-8 shrink-0" />
                                                )}
                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    {offer.gameId && (
                                                        <div className="flex min-w-0 items-center gap-1">
                                                            <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${offer.gameId}.png`} alt="Game" className="h-3 w-3 shrink-0 rounded-sm object-cover opacity-60" />
                                                            <span className="text-muted-foreground truncate text-[9px] font-bold tracking-widest uppercase">{getGameName(offer.gameId) || "Game"}</span>
                                                        </div>
                                                    )}
                                                    <span className="text-primary truncate text-xs font-medium sm:text-sm">{offer.offerTitle}</span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider whitespace-nowrap uppercase ${getStateBadgeClass(offer.offerState)}`}>{offer.offerState}</span>
                                                <span className="text-accent text-xs font-bold whitespace-nowrap tabular-nums">{formatCurrency(offer.pricePerUnit?.amount)}</span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-1 p-2.5 pt-0">
                                        <div className="border-border/50 bg-surface-1/50 flex items-center justify-between rounded-md border p-1.5">
                                            <p className="text-muted-foreground flex items-center gap-1.5 truncate text-[10px] font-medium">
                                                <Gamepad2Icon className="text-muted-foreground/70 h-3 w-3 shrink-0" />
                                                <span className="truncate">{offer.gameCategoryTitle}</span>
                                            </p>
                                            <div className="ml-2 flex shrink-0 items-center gap-2">
                                                <span className="text-muted-foreground flex items-center gap-0.5 text-[9px]">
                                                    <ClockIcon className="h-2.5 w-2.5" />
                                                    {formatDeliveryTime(offer.guaranteedDeliveryTime)}
                                                </span>
                                                <span className="bg-primary/15 text-primary rounded px-1.5 py-0.5 text-[9px] font-bold">×{offer.quantity}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-border bg-surface-2/50 flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
                        <span className="text-muted-foreground text-[10px]">
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
            <div className="border-border bg-surface-2/40 flex h-full flex-1 flex-col overflow-hidden rounded-2xl border backdrop-blur-sm">
                {!activeOffer ? (
                    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3">
                        <InfoIcon className="text-muted-foreground/60 h-8 w-8" />
                        <p className="text-sm">Pilih offer di sebelah kiri buat lihat detail.</p>
                    </div>
                ) : (
                    <div className="relative flex h-full flex-1 flex-col">
                        <div className="absolute inset-0 z-0 bg-black/80"></div>

                        <div className="relative z-10 flex h-full flex-col">
                            {/* Fixed Header */}
                            <div className="border-border/50 relative flex shrink-0 items-center justify-between overflow-hidden border-b bg-black/40 px-5 py-4 shadow-lg backdrop-blur-xl">
                                <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-r via-transparent to-transparent opacity-40"></div>
                                <div className="relative z-10 flex-1 overflow-hidden">
                                    <h1 className="text-foreground flex items-center gap-2.5 text-lg font-bold">
                                        <div className="bg-primary/20 border-primary/30 shrink-0 rounded-lg border p-1.5 shadow-[0_0_15px_rgb(124_92_255_/_0.2)]">{activeOffer.gameId ? <img src={`https://assetsdelivery.eldorado.gg/v7/_assets_/icons/v28/${activeOffer.gameId}.png`} alt="Game" className="h-4 w-4 shrink-0 rounded-sm object-cover" /> : <PackageIcon className="text-primary h-4 w-4" />}</div>
                                        <div className="flex flex-col">
                                            {activeOffer.gameId && <span className="text-muted-foreground text-[10px] font-normal tracking-widest uppercase">{getGameName(activeOffer.gameId) || "Game"}</span>}
                                            <span className="truncate">{activeOffer.offerTitle}</span>
                                        </div>
                                    </h1>
                                    <div className="mt-1 flex items-center gap-2 pl-9">
                                        <span className="text-muted-foreground/70 font-mono text-[10px]">{activeOffer.id}</span>
                                        <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${getStateBadgeClass(activeOffer.offerState)}`}>{activeOffer.offerState}</span>
                                    </div>
                                </div>

                                <div className="relative z-10 ml-3 flex shrink-0 gap-2">
                                    <Button onClick={() => handlePauseResume(activeOffer)} variant="outline" size="sm" className="border-border bg-surface-2/50 text-foreground/85 hover:text-foreground" disabled={actionLoading === activeOffer.id}>
                                        {actionLoading === activeOffer.id ? <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : activeOffer.offerState === "Active" ? <PauseCircleIcon className="mr-1.5 h-3.5 w-3.5" /> : <PlayCircleIcon className="mr-1.5 h-3.5 w-3.5" />}
                                        {activeOffer.offerState === "Active" ? "Pause" : "Resume"}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="border-danger/30 bg-danger/10 text-danger hover:bg-danger/20">
                                                <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="text-foreground border-border bg-surface-1">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl">Yakin hapus offer ini?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-muted-foreground">
                                                    Offer <span className="text-foreground font-mono">{activeOffer.id?.substring(0, 8)}...</span> bakal ilang dari Eldorado. <span className="text-danger">Ga bisa di-undo bro.</span>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-4">
                                                <AlertDialogCancel className="border-border bg-surface-2 text-foreground/85">Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(activeOffer.id)} className="bg-danger text-danger-foreground hover:bg-danger/90 font-bold">
                                                    Ya, Hapus!
                                                </AlertDialogAction>
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
                                        <DetailItem label="Status" value={activeOffer.offerState} valueClass={activeOffer.offerState === "Active" ? "text-success" : activeOffer.offerState === "Paused" ? "text-warning" : "text-muted-foreground"} icon={<PlayCircleIcon className="h-3 w-3" />} />
                                        <DetailItem label="Game SEO Alias" value={activeOffer.gameSeoAlias} icon={<GlobeIcon className="h-3 w-3" />} />
                                        <DetailItem label="Description" value={activeOffer.description} icon={<InfoIcon className="h-3 w-3" />} colSpan />
                                        <DetailItem label="Expire Date" value={formatDate(activeOffer.expireDate)} icon={<CalendarIcon className="h-3 w-3" />} />
                                        <DetailItem label="Offer Version" value={activeOffer.offerVersion} icon={<HashIcon className="h-3 w-3" />} />
                                        <DetailItem label="Is Product" value={activeOffer.isProduct ? "Yes" : "No"} icon={<PackageIcon className="h-3 w-3" />} />
                                        <DetailItem label="Product Key" value={activeOffer.standardizedProductKey} icon={<HashIcon className="h-3 w-3" />} />
                                    </DetailSection>

                                    {/* 2. Pricing */}
                                    <DetailSection title="Pricing" icon={<DollarSign className="text-primary h-4 w-4" />}>
                                        <EditableField label="Price Per Unit" value={activeOffer.pricePerUnit?.amount} icon={<DollarSign className="h-3 w-3" />} type="number" isLoading={priceLoading} onSave={(v) => handleUpdatePrice(activeOffer.id, v)} />
                                        <DetailItem label="Price w/ Discount" value={formatCurrency(activeOffer.pricePerUnitWithDiscount?.amount)} icon={<PercentIcon className="h-3 w-3" />} valueClass="text-success" />
                                        <DetailItem label="Price in USD" value={formatCurrency(activeOffer.pricePerUnitInUSD?.amount)} icon={<DollarSign className="h-3 w-3" />} />
                                        <DetailItem label="Discount %" value={activeOffer.discountPercentage ? `${activeOffer.discountPercentage}%` : "0%"} icon={<PercentIcon className="h-3 w-3" />} valueClass="text-warning" />
                                        <DetailItem label="Min Purchase Price" value={formatCurrency(activeOffer.minPurchasePrice?.amount)} icon={<DollarSign className="h-3 w-3" />} />
                                        <DetailItem label="Exchange Rate" value={activeOffer.exchangeRate ? `${activeOffer.exchangeRate.currency} × ${activeOffer.exchangeRate.exchangeRate}` : "-"} icon={<TrendingUpIcon className="h-3 w-3" />} />
                                        {activeOffer.volumeDiscounts?.length > 0 && (
                                            <div className="sm:col-span-2">
                                                <div className="border-border/50 bg-surface-2/40 rounded-lg border p-2.5">
                                                    <span className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase">
                                                        <LayersIcon className="h-3 w-3" /> Volume Discounts
                                                    </span>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {activeOffer.volumeDiscounts.map((vd, i) => (
                                                            <span key={i} className="border-border/50 bg-surface-3/60 text-foreground/85 rounded border px-2 py-0.5 text-[10px]">
                                                                {vd.quantity}+ → <span className="text-success">{vd.percentage}%</span>
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
                                        <div className="group/item border-border/50 bg-surface-2/40 hover:border-border/60 hover:bg-surface-3/50 relative flex flex-col gap-1 overflow-hidden rounded-lg border p-2.5 transition-colors">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-muted-foreground flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase">
                                                    <ClockIcon className="group-hover/item:text-primary text-muted-foreground h-3 w-3 transition-colors" />
                                                    Delivery Time
                                                </span>
                                                {!editDeliveryOpen && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-5 w-5 opacity-0 transition-opacity group-hover/item:opacity-100"
                                                        onClick={() => {
                                                            setEditDeliveryOpen(true);
                                                            setEditDeliveryValue(activeOffer.guaranteedDeliveryTime);
                                                        }}
                                                    >
                                                        <PencilIcon className="hover:text-accent text-muted-foreground h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            {editDeliveryOpen ? (
                                                <div className="flex items-center gap-1.5">
                                                    <select value={editDeliveryValue} onChange={(e) => setEditDeliveryValue(e.target.value)} className="focus:border-primary/50 border-border bg-surface-1 text-foreground h-7 flex-1 rounded border px-2 text-xs focus:outline-none">
                                                        {DELIVERY_TIME_OPTIONS.filter((o) => o.value).map((o) => (
                                                            <option key={o.value} value={o.value}>
                                                                {o.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Button size="icon" variant="ghost" className="text-success hover:text-success h-6 w-6" onClick={() => handleUpdateDeliveryTime(activeOffer.id, editDeliveryValue)} disabled={actionLoading === activeOffer.id}>
                                                        {actionLoading === activeOffer.id ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground/85 h-6 w-6" onClick={() => setEditDeliveryOpen(false)}>
                                                        <XIcon className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-foreground text-sm font-semibold">{formatDeliveryTime(activeOffer.guaranteedDeliveryTime)}</span>
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
                                                <div key={i} className="border-border/50 bg-surface-2/40 flex flex-col gap-1 rounded-lg border p-2.5">
                                                    <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">{attr.name}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className="border-border/50 bg-surface-3/60 text-muted-foreground rounded border px-1.5 py-0.5 text-[9px]">type: {attr.type}</span>
                                                        <span className="border-border/50 bg-surface-3/60 text-muted-foreground rounded border px-1.5 py-0.5 text-[9px]">display: {attr.display}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </DetailSection>
                                    )}

                                    {/* 8. Images */}
                                    {(activeOffer.mainOfferImage || activeOffer.offerImages?.length > 0) && (
                                        <DetailSection title="Images" icon={<ImageIcon className="text-primary h-4 w-4" />}>
                                            {activeOffer.mainOfferImage?.smallImage ? (
                                                <div className="group/item border-border/50 bg-surface-2/40 flex flex-col gap-2 overflow-hidden rounded-lg border p-2.5 sm:col-span-2">
                                                    <span className="text-muted-foreground flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase">
                                                        <ImageIcon className="h-3 w-3" /> Main Image
                                                    </span>
                                                    <img src={`https://fileserviceusprod.blob.core.windows.net/offerimages/${activeOffer.mainOfferImage.smallImage}`} alt="Main" className="h-24 w-24 rounded object-cover" />
                                                </div>
                                            ) : (
                                                activeOffer.mainOfferImage && <DetailItem label="Main Image" value="No image URL" icon={<ImageIcon className="h-3 w-3" />} colSpan />
                                            )}
                                            {activeOffer.offerImages?.map((img, i) => (
                                                <DetailItem key={i} label={`Image ${i + 1}`} value={img.smallImage || img.largeImage || "-"} icon={<ImageIcon className="h-3 w-3" />} />
                                            ))}
                                            {activeOffer.productImage && <DetailItem label="Product Image" value={activeOffer.productImage.name} icon={<ImageIcon className="h-3 w-3" />} />}
                                        </DetailSection>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
