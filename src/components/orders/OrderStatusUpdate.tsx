"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [prepTime, setPrepTime] = useState("30");
    const [selectedStatus, setSelectedStatus] = useState("");

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

    const handleStatusClick = (status: string) => {
        if (status === 'confirmed') {
            setSelectedStatus(status);
            setIsDialogOpen(true);
        } else {
            handleUpdate(status);
        }
    };

    const handleUpdate = async (status: string, prepTimeMinutes?: number) => {
        setIsUpdating(true);
        try {
            await orderService.updateStatus(orderId, status, prepTimeMinutes);
            toast.success(`Order status updated to ${status}`);
            setIsDialogOpen(false);
            onStatusUpdate();
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = async () => {
        setIsUpdating(true);
        try {
            await orderService.cancelOrder(orderId, "Cancelled by retailer");
            toast.success("Order cancelled successfully");
            setIsCancelDialogOpen(false);
            onStatusUpdate();
        } catch (error) {
            console.error("Failed to cancel order", error);
            toast.error("Failed to cancel order");
        } finally {
            setIsUpdating(false);
        }
    };

    const canCancel = ['pending', 'confirmed', 'processing', 'waiting_for_customer_approval'].includes(currentStatus.toLowerCase());

    if (nextStatuses.length === 0 && !canCancel) {
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
                        onClick={() => handleStatusClick(status)}
                        disabled={isUpdating}
                    >
                        {label}
                    </Button>
                );
            })}

            {canCancel && (
                <Button 
                    variant="destructive" 
                    onClick={() => setIsCancelDialogOpen(true)}
                    disabled={isUpdating}
                >
                    CANCEL ORDER
                </Button>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Order</DialogTitle>
                        <DialogDescription>
                            Enter the estimated preparation time to notify the customer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prepTime" className="text-right">
                                Time (min)
                            </Label>
                            <Input
                                id="prepTime"
                                type="number"
                                value={prepTime}
                                onChange={(e) => setPrepTime(e.target.value)}
                                className="col-span-3"
                                min="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            disabled={isUpdating || !prepTime || parseInt(prepTime) <= 0}
                            onClick={() => handleUpdate(selectedStatus, parseInt(prepTime))}
                        >
                            Confirm Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Cancel Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this order? This action cannot be undone and product stock will be restored.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" disabled={isUpdating} onClick={() => setIsCancelDialogOpen(false)}>Go Back</Button>
                        <Button
                            variant="destructive"
                            disabled={isUpdating}
                            onClick={handleCancel}
                        >
                            Yes, Cancel Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
