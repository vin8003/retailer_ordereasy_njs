"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ChevronLeft, Loader2 } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

import api from "@/services/api";
import { InfiniteScrollTrigger } from "@/components/dashboard/InfiniteScrollTrigger";
import { SalesReturnList, type SalesReturnListItem } from "@/components/returns/SalesReturnList";

function unwrapSalesReturns(payload: unknown): { rows: SalesReturnListItem[]; next: string | null } {
    if (Array.isArray(payload)) {
        return { rows: payload as SalesReturnListItem[], next: null };
    }
    if (payload && typeof payload === "object") {
        const data = payload as { results?: unknown; next?: string | null };
        const rows = Array.isArray(data.results) ? (data.results as SalesReturnListItem[]) : [];
        return { rows, next: data.next || null };
    }
    return { rows: [], next: null };
}

export default function SalesReturnsPage() {
    const [returns, setReturns] = useState<SalesReturnListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);

    const fetchReturns = useCallback(async (isAppend = false) => {
        if (isAppend) {
            setIsFetchingMore(true);
        } else {
            setIsLoading(true);
        }

        try {
            const params: Record<string, string> = {};
            if (isAppend && nextPage) {
                const url = new URL(nextPage);
                const page = url.searchParams.get("page");
                if (page) params.page = page;
            }

            const response = await api.get("/returns/sales/", { params });
            const { rows, next } = unwrapSalesReturns(response.data);

            if (isAppend) {
                setReturns((prev) => [...prev, ...rows]);
            } else {
                setReturns(rows);
            }
            setNextPage(next);
        } catch (error) {
            console.error("Failed to fetch sales returns:", error);
            toast.error("Failed to load sales returns");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [nextPage]);

    useEffect(() => {
        setNextPage(null);
        fetchReturns(false);
        // Initial list load only — do not refetch when nextPage changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/orders"
                    className="p-3 hover:bg-white rounded-2xl border border-gray-100 transition-all text-gray-400 hover:text-gray-900 shadow-sm"
                    aria-label="Back to orders"
                >
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-red-700 flex items-center gap-3">
                        <ArrowLeftRight className="text-red-500" /> Sales Returns
                    </h2>
                    <p className="text-muted-foreground">
                        Preview customer sale returns. Optional notes appear when the backend sends them.
                    </p>
                </div>
            </div>

            {isLoading && returns.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
            ) : (
                <SalesReturnList returns={returns} isLoading={false} />
            )}

            <InfiniteScrollTrigger
                onLoadMore={() => fetchReturns(true)}
                hasMore={!!nextPage}
                isLoading={isFetchingMore}
            />
        </div>
    );
}
