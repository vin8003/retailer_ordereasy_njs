"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { OrderTable } from "@/components/orders/OrderTable";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { orderService } from "@/services/api";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const response = await orderService.fetchOrders(params);
            // Handle pagination response structure (results array)
            const data = response.data.results || response.data;
            setOrders(data);
        } catch (error: any) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search or just use effect? 
    // For simplicity, we trigger on effect change with a small timeout or just on filter change
    // Using effect dependency for simplicity
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 300); // 300ms debounce for search

        return () => clearTimeout(timer);
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
            </div>
        </div>
    );
}
