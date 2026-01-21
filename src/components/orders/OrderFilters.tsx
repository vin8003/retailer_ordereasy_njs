"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderFiltersProps {
    currentStatus: string;
    onStatusChange: (status: string) => void;
}

export function OrderFilters({ currentStatus, onStatusChange }: OrderFiltersProps) {
    const statuses = [
        { value: "all", label: "All Orders" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ];

    return (
        <Tabs value={currentStatus} onValueChange={onStatusChange} className="w-full">
            <TabsList className="bg-muted/50 p-1">
                {statuses.map((status) => (
                    <TabsTrigger
                        key={status.value}
                        value={status.value}
                        className="px-4 py-2 text-sm font-medium transition-all"
                    >
                        {status.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
