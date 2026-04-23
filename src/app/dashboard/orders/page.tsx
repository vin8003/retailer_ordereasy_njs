"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

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
                response = await orderService.fetchOrders({ ...params, page });
            } else {
                response = await orderService.fetchOrders(params);
            }

            const data = response.data.results || response.data;
            const next = response.data.next || null;

            if (isAppend) {
                setOrders(prev => [...prev, ...data]);
            } else {
                setOrders(data);
            }
            setNextPage(next);
        } catch (error: any) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [statusFilter, searchQuery, nextPage]);

    // Initial fetch and filter/search change
    useEffect(() => {
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
                <p className="text-muted-foreground">
                    Manage and track your customer orders here.
                </p>
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
