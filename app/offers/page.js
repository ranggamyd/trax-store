"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getEldoradoOffers } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SearchIcon, FilterIcon, PackageIcon, Gamepad2Icon, ClockIcon, DollarSign, PlayCircleIcon, InfoIcon, HistoryIcon, PencilIcon, Trash2Icon, PauseCircleIcon, PlusIcon } from "lucide-react";

const formatJsonValue = (data) => {
    if (!data) return "-";
    return String(data);
};

const DetailSectionInline = ({ title, icon, children }) => (
    <div className="group/section relative mb-5 rounded-2xl border border-white/[0.03] bg-zinc-950/40 p-4 shadow-lg sm:p-5">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.01] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/section:opacity-100"></div>
        <div className="relative z-10 mb-4 flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-xl p-2 shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all">{icon}</div>
            <h3 className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-base font-bold tracking-tight text-transparent">{title}</h3>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
    </div>
);

const DetailItemInline = ({ label, value, valueClass = "text-zinc-200", icon }) => {
    return (
        <div className="group/item flex flex-col gap-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5 transition-colors hover:bg-zinc-800/50">
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                    <div className="group-hover/item:text-primary text-zinc-500 transition-colors">{icon}</div>
                    {label}
                </span>
            </div>
            <span className={`text-xs font-semibold ${valueClass} truncate`} title={typeof value === "string" ? value : ""}>
                {value !== undefined && value !== null && value !== "" ? value : "-"}
            </span>
        </div>
    );
};

export default function OffersPage() {
    const [activeOffers, setActiveOffers] = useState([]);
    const [activeOfferId, setActiveOfferId] = useState(null);

    const [isLoadingOffers, setIsLoadingOffers] = useState(true);
    const [apiError, setApiError] = useState(null);

    const [tokenId, setTokenId] = useState("");
    const [isSavingToken, setIsSavingToken] = useState(false);

    // Filter States
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [offerStateFilter, setOfferStateFilter] = useState("");

    const activeOfferList = Array.isArray(activeOffers) ? activeOffers : [];
    const activeOfferDetails = activeOfferList.find((o) => o.id === activeOfferId) || null;

    const fetchOffers = async () => {
        setIsLoadingOffers(true);
        const res = await getEldoradoOffers({
            query: searchQuery,
            offerState: offerStateFilter,
        });
        setIsLoadingOffers(false);

        if (res.success) {
            let fetchedOffers = res.data;
            if (offerStateFilter) {
                fetchedOffers = fetchedOffers.filter((o) => o.offerState === offerStateFilter);
            }
            setActiveOffers(fetchedOffers);
            if (fetchedOffers.length > 0 && !activeOfferId) setActiveOfferId(fetchedOffers[0].id);
        } else {
            setApiError(res.error);
            toast.error("Gagal narik offers: " + res.error);
        }
    };

    useEffect(() => {
        import("@/app/actions").then(({ getEldoradoToken }) => {
            getEldoradoToken().then((t) => setTokenId(t || ""));
        });
        fetchOffers();
    }, [searchQuery, offerStateFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput);
    };

    const handleSaveToken = async () => {
        setIsSavingToken(true);
        try {
            const { setEldoradoToken } = await import("@/app/actions");
            await setEldoradoToken(tokenId);
            toast.success("Token berhasil disimpan! Me-refresh offers...");
            setActiveOfferId(null);
            await fetchOffers();
        } catch (err) {
            toast.error("Gagal update token");
        } finally {
            setIsSavingToken(false);
        }
    };

    const handleAction = (actionName) => {
        toast.success(`Action: ${actionName} triggered!`, {
            description: "API Eldorado integration pending.",
        });
    };

    return (
        <div className="text-foreground min-h-screen bg-black p-4 pb-20 md:p-8">
            <div className="mx-auto flex h-[85vh] w-full max-w-7xl flex-col gap-6 md:flex-row">
                {/* Kiri: List Offers */}
                <div className="flex h-full w-full shrink-0 flex-col gap-3 md:w-1/3">
                    <div className="relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md">
                        <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-br to-transparent"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <h1 className="neon-text-primary text-xl font-bold tracking-widest uppercase">Listingan Offers</h1>
                            <Button size="icon" variant="ghost" className="h-8 w-8 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white" onClick={() => handleAction("Create Offer")}>
                                <PlusIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Filter UI */}
                        <div className="relative z-10 flex gap-2">
                            <form onSubmit={handleSearchSubmit} className="relative flex-1">
                                <SearchIcon className="absolute top-2 left-2.5 h-4 w-4 text-zinc-500" />
                                <input type="text" placeholder="Cari offer..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="focus:border-primary/50 h-8 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pr-3 pl-8 text-xs text-zinc-200 transition-colors placeholder:text-zinc-600 focus:outline-none" />
                            </form>
                            <div className="relative w-[100px] shrink-0">
                                <FilterIcon className="pointer-events-none absolute top-2.5 left-2 z-10 h-3 w-3 text-zinc-500" />
                                <select value={offerStateFilter} onChange={(e) => setOfferStateFilter(e.target.value)} className="focus:border-primary/50 h-8 w-full cursor-pointer appearance-none rounded-lg border border-zinc-800 bg-zinc-950/80 pr-2 pl-6 text-xs text-zinc-200 transition-colors focus:outline-none">
                                    <option value="">Semua</option>
                                    <option value="Active">Active</option>
                                    <option value="Paused">Paused</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-2">
                        {isLoadingOffers ? (
                            <div className="flex flex-col gap-2">
                                {[...Array(6)].map((_, i) => (
                                    <Card key={i} className="border-zinc-800 bg-zinc-900/40 p-2.5">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div className="flex w-2/3 flex-col gap-1">
                                                <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                                                <Skeleton className="h-3 w-1/3 bg-zinc-800" />
                                            </div>
                                            <div className="flex w-1/4 flex-col items-end gap-1">
                                                <Skeleton className="h-4 w-full bg-zinc-800" />
                                                <Skeleton className="mt-1 h-4 w-2/3 bg-zinc-800" />
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between border-t border-zinc-800/50 pt-2">
                                            <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                                            <Skeleton className="h-4 w-1/4 bg-zinc-800" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : apiError ? (
                            <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                                {apiError}
                                <p className="mt-2 text-xs opacity-70">Pastiin ELDORADO_ID_TOKEN bener bro!</p>
                            </div>
                        ) : activeOfferList.length === 0 ? (
                            <div className="p-4 text-center text-sm text-zinc-500">Gak ada offer nih bro.</div>
                        ) : (
                            activeOfferList.map((offer) => (
                                <Card key={offer.id} className={`cursor-pointer border transition-all ${activeOfferId === offer.id ? "border-primary/50 bg-zinc-800/80 shadow-[0_0_10px_rgba(255,0,255,0.1)]" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40"}`} onClick={() => setActiveOfferId(offer.id)}>
                                    <CardHeader className="p-2.5 pb-1">
                                        <CardTitle className="flex items-start justify-between text-sm font-bold text-zinc-200">
                                            <div className="flex max-w-[65%] flex-col gap-1">
                                                <span className="text-primary flex items-center gap-2 truncate font-bold">
                                                    <PackageIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                                                    <span className="truncate">{offer.offerTitle}</span>
                                                </span>
                                                <span className="truncate font-mono text-[10px] text-zinc-500">ID: {offer.id.split("-")[0]}...</span>
                                            </div>
                                            <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${offer.offerState === "Active" ? "border border-green-500/30 bg-green-500/20 text-green-400" : offer.offerState === "Paused" ? "border border-yellow-500/30 bg-yellow-500/20 text-yellow-400" : "border border-zinc-700 bg-zinc-800 text-zinc-300"}`}>{offer.offerState}</span>
                                                <span className="text-accent mt-0.5 text-xs font-bold">${offer.pricePerUnit?.amount?.toFixed(2)}</span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="mt-1 flex flex-col gap-1.5 p-2.5 pt-0">
                                        <div className="flex items-center justify-between rounded-md border border-zinc-800/50 bg-zinc-950/50 p-1.5">
                                            <p className="flex items-center gap-1.5 truncate text-xs font-medium text-zinc-300">
                                                <Gamepad2Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                <span className="truncate">{offer.gameCategoryTitle}</span>
                                            </p>
                                            <span className="bg-primary/20 text-primary ml-2 flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold">Qty: {offer.quantity}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Kanan: Detail Spesifik Offer */}
                <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
                    {!activeOfferDetails ? (
                        <div className="flex flex-1 items-center justify-center text-zinc-500">Pilih offer di sebelah kiri buat edit & lihat detail.</div>
                    ) : (
                        <div className="relative flex h-full flex-1 flex-col">
                            <div className="absolute inset-0 z-0 bg-black/80"></div>

                            <div className="relative z-10 flex h-full flex-col">
                                {/* Fixed Header */}
                                <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-zinc-800/50 bg-black/40 p-6 shadow-lg backdrop-blur-xl">
                                    <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-r via-transparent to-transparent opacity-50"></div>
                                    <div className="relative z-10 flex-1">
                                        <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
                                            <div className="bg-primary/20 border-primary/30 rounded-xl border p-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                                <InfoIcon className="text-primary h-6 w-6" />
                                            </div>
                                            Detail Offer <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-lg text-zinc-500">#{activeOfferDetails.id?.split("-")[0]}</span>
                                        </h1>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={() => handleAction(activeOfferDetails.offerState === "Active" ? "Pause" : "Resume")} variant="outline" className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:text-white">
                                            {activeOfferDetails.offerState === "Active" ? <PauseCircleIcon className="mr-2 h-4 w-4" /> : <PlayCircleIcon className="mr-2 h-4 w-4" />}
                                            {activeOfferDetails.offerState === "Active" ? "Pause" : "Resume"}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" className="border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                                    <Trash2Icon className="mr-2 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="text-foreground border-zinc-800 bg-zinc-950">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-xl">Yakin hapus offer ini?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-zinc-400">
                                                        Offer <span className="font-mono text-white">{activeOfferDetails.id}</span> bakal ilang dari Eldorado. Awas ga bisa di-undo bro.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="mt-4">
                                                    <AlertDialogCancel className="border-zinc-700 bg-zinc-900 text-zinc-300">Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleAction("Delete")} className="bg-red-500 font-bold text-white hover:bg-red-600">
                                                        Ya, Hapus!
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                                    <div className="mx-auto max-w-4xl space-y-2">
                                        <DetailSectionInline title="1. Offer Overview" icon={<HistoryIcon className="text-primary h-5 w-5" />}>
                                            <DetailItemInline label="Title" value={activeOfferDetails.offerTitle} icon={<PackageIcon className="h-3 w-3" />} />
                                            <DetailItemInline label="Category" value={activeOfferDetails.category} icon={<Gamepad2Icon className="h-3 w-3" />} />
                                            <DetailItemInline label="Description" value={activeOfferDetails.description} icon={<InfoIcon className="h-3 w-3" />} />
                                            <DetailItemInline label="Status" value={activeOfferDetails.offerState} valueClass={activeOfferDetails.offerState === "Active" ? "text-green-400" : "text-yellow-400"} icon={<PlayCircleIcon className="h-3 w-3" />} />
                                        </DetailSectionInline>

                                        <DetailSectionInline title="2. Pricing & Delivery" icon={<DollarSign className="text-primary h-5 w-5" />}>
                                            <div className="group/item relative flex flex-col gap-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5 transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/50">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                                                        <DollarSign className="group-hover/item:text-primary h-3 w-3 text-zinc-500 transition-colors" />
                                                        Price Per Unit
                                                    </span>
                                                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-5 w-5" onClick={() => handleAction("Edit Price")}>
                                                        <PencilIcon className="hover:text-accent h-3 w-3 text-zinc-400" />
                                                    </Button>
                                                </div>
                                                <span className="text-accent text-lg font-bold">${activeOfferDetails.pricePerUnit?.amount?.toFixed(2)}</span>
                                            </div>

                                            <div className="group/item relative flex flex-col gap-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5 transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/50">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                                                        <ClockIcon className="group-hover/item:text-primary h-3 w-3 text-zinc-500 transition-colors" />
                                                        Guaranteed Delivery Time
                                                    </span>
                                                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-5 w-5" onClick={() => handleAction("Edit Delivery Time")}>
                                                        <PencilIcon className="hover:text-accent h-3 w-3 text-zinc-400" />
                                                    </Button>
                                                </div>
                                                <span className="text-sm font-semibold text-zinc-200">{activeOfferDetails.guaranteedDeliveryTime}</span>
                                            </div>

                                            <DetailItemInline label="Available Quantity" value={activeOfferDetails.quantity} icon={<PackageIcon className="h-3 w-3" />} />
                                        </DetailSectionInline>

                                        <div className="mt-4 flex justify-end">
                                            <Button onClick={() => handleAction("Edit Full Details")} className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 border">
                                                <PencilIcon className="mr-2 h-4 w-4" />
                                                Edit Full Details
                                            </Button>
                                        </div>
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
