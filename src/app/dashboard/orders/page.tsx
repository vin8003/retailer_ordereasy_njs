"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeftRight, CheckCircle2, Search, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { OrderTable } from "@/components/orders/OrderTable";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { orderService } from "@/services/api";
import { InfiniteScrollTrigger } from "@/components/dashboard/InfiniteScrollTrigger";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPage, setNextPage] = useState<string | null>(null);

    const fetchOrders = useCallback(async (isAppend = false) => {
        if (isAppend) {
            setIsFetchingMore(true);
        } else {
            setIsLoading(true);
        }

        try {
            const params: any = {};
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            let response;
            if (isAppend && nextPage) {
                const url = new URL(nextPage);
                const page = url.searchParams.get('page');
                response = await orderService.fetchOrderList({ ...params, page });
            } else {
                response = await orderService.fetchOrderList(params);
            }

            const payload = response.data;
            const data = Array.isArray(payload?.results)
                ? payload.results
                : (Array.isArray(payload) ? payload : []);
            const next = payload?.next || null;

            if (isAppend) {
                setOrders(prev => [...prev, ...data]);
            } else {
                setOrders(data);
            }
            setNextPage(next);
        } catch (error: any) {
            console.error("Failed to fetch orders:", error);
            // KAN-77: Returned tab used to 500 when status=returned missed
            // sales-return rows. Fall back to client-side is_returned so the
            // tab still loads instead of "Failed to load orders".
            if (statusFilter === "returned" && !isAppend) {
                try {
                    const fallback = await orderService.fetchOrders(
                        searchQuery ? { search: searchQuery } : {}
                    );
                    const payload = fallback.data;
                    const all = Array.isArray(payload?.results)
                        ? payload.results
                        : (Array.isArray(payload) ? payload : []);
                    setOrders(all.filter((o: any) => o.is_returned || o.status === "returned"));
                    setNextPage(null);
                    return;
                } catch (fallbackError) {
                    console.error("Returned-orders fallback failed:", fallbackError);
                }
            }
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [statusFilter, searchQuery, nextPage]);

    // Initial fetch and filter/search change
    useEffect(() => {
        setNextPage(null);
        const timer = setTimeout(() => {
            fetchOrders(false);
        }, 300);

        const handleFcmUpdate = () => {
            console.log('Retailer Orders page refreshing due to FCM update');
            fetchOrders(false);
        };

        window.addEventListener('fcm_order_update', handleFcmUpdate);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('fcm_order_update', handleFcmUpdate);
        };
    }, [statusFilter, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
                    <p className="text-muted-foreground">
                        Manage active orders from the inbox or view complete store and online order history.
                    </p>
                </div>
                <Link
                    href="/dashboard/orders/returns"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                    <ArrowLeftRight size={16} className="text-red-500" /> Sales returns
                </Link>
            </div>

            {/* Quick Filter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => setStatusFilter("active")}
                    className={cn(
                        "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                        statusFilter === "active"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 ring-2 ring-amber-500/20 shadow-sm"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                    )}
                >
                    <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        statusFilter === "active" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"
                    )}>
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Active Inbox</div>
                        <div className="text-xs text-muted-foreground">Orders needing action</div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={cn(
                        "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                        statusFilter === "all"
                            ? "bg-primary/10 border-primary/30 text-primary ring-2 ring-primary/20 shadow-sm"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                    )}
                >
                    <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        statusFilter === "all" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}>
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm">All Orders</div>
                        <div className="text-xs text-muted-foreground">Store POS + Online history</div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter("delivered")}
                    className={cn(
                        "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                        statusFilter === "delivered"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                    )}
                >
                    <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        statusFilter === "delivered" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"
                    )}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Delivered</div>
                        <div className="text-xs text-muted-foreground">Completed counter & delivery</div>
                    </div>
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search order #..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <OrderFilters
                    currentStatus={statusFilter}
                    onStatusChange={setStatusFilter}
                />

                <OrderTable orders={orders} isLoading={isLoading} />
                
                <InfiniteScrollTrigger 
                    onLoadMore={() => fetchOrders(true)} 
                    hasMore={!!nextPage} 
                    isLoading={isFetchingMore} 
                />
            </div>
        </div>
    );
}
