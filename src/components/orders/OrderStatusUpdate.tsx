"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/api";

interface OrderStatusUpdateProps {
    orderId: number;
    currentStatus: string;
    deliveryMode?: string;
    onStatusUpdate: () => void;
}

export function OrderStatusUpdate({
    orderId,
    currentStatus,
    deliveryMode,
    onStatusUpdate
}: OrderStatusUpdateProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const getNextStatuses = (status: string, mode: string = 'delivery') => {
        const s = status.toLowerCase();
        if (s === 'pending') return ['confirmed'];
        if (s === 'confirmed') return ['processing', 'packed'];
        if (s === 'processing') return ['packed'];
        if (s === 'packed') return mode === 'pickup' ? ['delivered'] : ['out_for_delivery'];
        if (s === 'out_for_delivery') return ['delivered'];
        return [];
    };

    const nextStatuses = getNextStatuses(currentStatus, deliveryMode);

    const handleUpdate = async (status: string) => {
        setIsUpdating(true);
        try {
            await orderService.updateStatus(orderId, status);
            toast.success(`Order status updated to ${status}`);
            onStatusUpdate();
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    if (nextStatuses.length === 0) {
        if (['cancelled', 'delivered'].includes(currentStatus.toLowerCase())) {
            return (
                <div className="text-muted-foreground italic text-sm">
                    This order is {currentStatus}. No further actions.
                </div>
            );
        }
        return <div className="text-muted-foreground text-sm">No actions available</div>;
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((status) => {
                let label = status.toUpperCase().replace(/_/g, " ");
                if (deliveryMode === 'pickup') {
                    if (status === 'packed') label = 'READY FOR PICKUP';
                    if (status === 'delivered') label = 'MARK AS PICKED UP';
                }

                return (
                    <Button
                        key={status}
                        onClick={() => handleUpdate(status)}
                        disabled={isUpdating}
                    >
                        {label}
                    </Button>
                );
            })}
        </div>
    );
}
