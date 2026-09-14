"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/api";
import { dispatchOrderStatsRefresh } from "@/hooks/orderStatsRefresh";
import {
    buildInboxDispatchPayload,
    buildInboxMarkDeliveredPayload,
    buildInboxMarkFailedPayload,
    buildInboxOfdMarkDeliveredPayload,
    isOfdDeliveryCloseOut,
    validateFailedReason,
} from "@/lib/fulfillment";
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
import { Textarea } from "@/components/ui/textarea";

interface OrderStatusUpdateProps {
    orderId: number;
    currentStatus: string;
    deliveryMode?: string;
    customerId?: number;
    onStatusUpdate: () => void;
    /** When false, status action buttons are hidden (OE-98 orders.update). */
    canUpdateOrders?: boolean;
}

export function OrderStatusUpdate({
    orderId,
    currentStatus,
    deliveryMode,
    customerId,
    onStatusUpdate,
    canUpdateOrders = true,
}: OrderStatusUpdateProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);
    const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isFailedDialogOpen, setIsFailedDialogOpen] = useState(false);
    const [prepTime, setPrepTime] = useState("30");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [courierName, setCourierName] = useState("");
    const [courierPhone, setCourierPhone] = useState("");
    const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState("");
    const [pickupCode, setPickupCode] = useState("");
    const [failedReason, setFailedReason] = useState("");
    const [failedReasonError, setFailedReasonError] = useState<string | null>(null);

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
        } else if (status === 'out_for_delivery' && deliveryMode === 'pickup') {
            return;
        } else if (status === 'out_for_delivery') {
            setSelectedStatus(status);
            setCourierName("");
            setCourierPhone("");
            setEstimatedDeliveryTime("");
            setIsDispatchDialogOpen(true);
        } else if (status === 'delivered' && deliveryMode === 'pickup') {
            setSelectedStatus(status);
            setPickupCode("");
            setIsPickupDialogOpen(true);
        } else {
            handleUpdate(status);
        }
    };

    const handleUpdate = async (
        status: string,
        prepTimeMinutes?: number,
        dispatch?: { name: string; phone: string; estimatedDeliveryTime?: string },
        pickup?: { pickupCode: string }
    ) => {
        setIsUpdating(true);
        try {
            if (status === 'out_for_delivery' && dispatch) {
                await orderService.inboxAction(
                    orderId,
                    buildInboxDispatchPayload(dispatch)
                );
            } else if (status === 'delivered' && deliveryMode === 'pickup') {
                const code = pickup?.pickupCode?.trim() ?? "";
                if (!code) {
                    toast.error("Pickup code is required");
                    return;
                }
                await orderService.inboxAction(
                    orderId,
                    buildInboxMarkDeliveredPayload({ pickupCode: code, customerId })
                );
            } else if (status === 'delivered' && isOfdDeliveryCloseOut(currentStatus, deliveryMode)) {
                await orderService.inboxAction(
                    orderId,
                    buildInboxOfdMarkDeliveredPayload()
                );
            } else {
                await orderService.updateStatus(orderId, status, prepTimeMinutes);
            }
            toast.success(`Order status updated to ${status.replace(/_/g, ' ')}`);
            dispatchOrderStatsRefresh();
            setIsDialogOpen(false);
            setIsDispatchDialogOpen(false);
            setIsPickupDialogOpen(false);
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
            dispatchOrderStatsRefresh();
            setIsCancelDialogOpen(false);
            onStatusUpdate();
        } catch (error) {
            console.error("Failed to cancel order", error);
            toast.error("Failed to cancel order");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkFailed = async () => {
        const reasonError = validateFailedReason(failedReason);
        if (reasonError) {
            setFailedReasonError(reasonError);
            return;
        }
        setIsUpdating(true);
        try {
            await orderService.inboxAction(
                orderId,
                buildInboxMarkFailedPayload(failedReason)
            );
            toast.success("Order marked as failed");
            dispatchOrderStatsRefresh();
            setIsFailedDialogOpen(false);
            setFailedReason("");
            setFailedReasonError(null);
            onStatusUpdate();
        } catch (error) {
            console.error("Failed to mark order as failed", error);
            toast.error("Failed to mark order as failed");
        } finally {
            setIsUpdating(false);
        }
    };

    const canCancel = ['pending', 'confirmed', 'processing', 'waiting_for_customer_approval'].includes(currentStatus.toLowerCase());
    const canMarkFailed = isOfdDeliveryCloseOut(currentStatus, deliveryMode);
    const isDispatchValid = courierName.trim().length > 0 && courierPhone.trim().length >= 10;
    const isPickupValid = pickupCode.trim().length > 0;

    if (!canUpdateOrders) {
        return (
            <div className="text-muted-foreground text-sm italic">
                You do not have permission to update orders (orders.update).
            </div>
        );
    }

    if (nextStatuses.length === 0 && !canCancel && !canMarkFailed) {
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
                if (status === 'out_for_delivery') label = 'DISPATCH';
                if (status === 'delivered' && canMarkFailed) label = 'MARK AS DELIVERED';

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

            {canMarkFailed && (
                <Button
                    variant="destructive"
                    onClick={() => {
                        setFailedReason("");
                        setFailedReasonError(null);
                        setIsFailedDialogOpen(true);
                    }}
                    disabled={isUpdating}
                >
                    MARK AS FAILED
                </Button>
            )}

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

            <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Dispatch Order</DialogTitle>
                        <DialogDescription>
                            Assign a delivery person before marking this order out for delivery.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="courierName">Delivery person name</Label>
                            <Input
                                id="courierName"
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                placeholder="e.g. Rajesh Kumar"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="courierPhone">Delivery person phone</Label>
                            <Input
                                id="courierPhone"
                                type="tel"
                                value={courierPhone}
                                onChange={(e) => setCourierPhone(e.target.value)}
                                placeholder="10-digit mobile number"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="estimatedDelivery">Estimated delivery time (optional)</Label>
                            <Input
                                id="estimatedDelivery"
                                type="datetime-local"
                                value={estimatedDeliveryTime}
                                onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDispatchDialogOpen(false)}>Cancel</Button>
                        <Button
                            disabled={isUpdating || !isDispatchValid}
                            onClick={() =>
                                handleUpdate('out_for_delivery', undefined, {
                                    name: courierName,
                                    phone: courierPhone,
                                    estimatedDeliveryTime: estimatedDeliveryTime
                                        ? new Date(estimatedDeliveryTime).toISOString()
                                        : undefined,
                                })
                            }
                        >
                            Dispatch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPickupDialogOpen} onOpenChange={setIsPickupDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Mark as picked up</DialogTitle>
                        <DialogDescription>
                            Enter the customer&apos;s pickup code to verify collection before completing this order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pickupCode">Pickup code</Label>
                            <Input
                                id="pickupCode"
                                value={pickupCode}
                                onChange={(e) => setPickupCode(e.target.value)}
                                placeholder="Enter pickup code"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPickupDialogOpen(false)}>Cancel</Button>
                        <Button
                            disabled={isUpdating || !isPickupValid}
                            onClick={() => handleUpdate('delivered', undefined, undefined, { pickupCode })}
                        >
                            Mark as picked up
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isFailedDialogOpen} onOpenChange={setIsFailedDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Mark as failed</DialogTitle>
                        <DialogDescription>
                            Record why this out-for-delivery order failed. A reason is required.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-4">
                        <Label htmlFor="failedReason">Reason</Label>
                        <Textarea
                            id="failedReason"
                            value={failedReason}
                            onChange={(e) => {
                                setFailedReason(e.target.value);
                                if (failedReasonError) setFailedReasonError(null);
                            }}
                            placeholder="Why did this delivery fail?"
                            aria-invalid={!!failedReasonError}
                        />
                        {failedReasonError && (
                            <p className="text-sm text-destructive" role="alert">
                                {failedReasonError}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" disabled={isUpdating} onClick={() => setIsFailedDialogOpen(false)}>
                            Go back
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isUpdating}
                            onClick={handleMarkFailed}
                        >
                            Mark as failed
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
