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
        { value: "waiting_for_customer_approval", label: "Awaiting Appr." },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "packed", label: "Packed" },
        { value: "out_for_delivery", label: "Out for Delivery" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
        { value: "returned", label: "Returned" },
    ];

    return (
        <Tabs value={currentStatus} onValueChange={onStatusChange} className="w-full">
            <div className="w-full overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsList className="bg-muted/50 p-1 flex justify-start w-max h-10">
                    {statuses.map((status) => (
                        <TabsTrigger
                            key={status.value}
                            value={status.value}
                            className="px-4 py-2 text-sm font-medium transition-all shrink-0"
                        >
                            {status.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
        </Tabs>
    );
}
