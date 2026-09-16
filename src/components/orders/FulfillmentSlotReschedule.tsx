"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { fulfillmentService, orderService } from "@/services/api";
import { formatFulfillmentSlot, formatSlotOptionLabel, FulfillmentSlotOption } from "@/lib/fulfillment";

interface FulfillmentSlotRescheduleProps {
    orderId: number;
    retailerId: number;
    deliveryMode: string;
    currentSlotStart?: string | null;
    currentSlotEnd?: string | null;
    orderStatus: string;
    onRescheduled: () => void;
}

export function FulfillmentSlotReschedule({
    orderId,
    retailerId,
    deliveryMode,
    currentSlotStart,
    currentSlotEnd,
    orderStatus,
    onRescheduled,
}: FulfillmentSlotRescheduleProps) {
    const [open, setOpen] = useState(false);
    const [slots, setSlots] = useState<FulfillmentSlotOption[]>([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const terminal = ['delivered', 'cancelled', 'returned'].includes(orderStatus.toLowerCase());
    const slotLabel = formatFulfillmentSlot(currentSlotStart, currentSlotEnd);

    useEffect(() => {
        if (!open) return;

        const loadSlots = async () => {
            setIsLoading(true);
            try {
                const res = await fulfillmentService.fetchSlots(retailerId, {
                    delivery_mode: deliveryMode,
                    days: 7,
                });
                const available = (res.data.slots || []).filter(
                    (s: FulfillmentSlotOption) => s.is_available
                );
                setSlots(available);
                if (available.length > 0) {
                    setSelectedSlot(available[0].slot_start);
                }
            } catch (err) {
                console.error("Failed to load fulfillment slots", err);
                toast.error("Failed to load available slots");
            } finally {
                setIsLoading(false);
            }
        };

        loadSlots();
    }, [open, retailerId, deliveryMode]);

    const handleReschedule = async () => {
        if (!selectedSlot) return;
        setIsSaving(true);
        try {
            await orderService.rescheduleFulfillmentSlot(orderId, selectedSlot);
            toast.success("Fulfillment slot updated");
            setOpen(false);
            onRescheduled();
        } catch (err) {
            console.error("Failed to reschedule slot", err);
            toast.error("Failed to reschedule slot");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                    <p className="font-medium">
                        {deliveryMode === 'pickup' ? 'Pickup window' : 'Delivery window'}
                    </p>
                    <p className="text-muted-foreground">
                        {slotLabel || "No slot scheduled"}
                    </p>
                    {currentSlotStart && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(currentSlotStart), "yyyy-MM-dd HH:mm")} (local start)
                        </p>
                    )}
                </div>
            </div>

            {!terminal && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                            Reschedule slot
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reschedule fulfillment slot</DialogTitle>
                            <DialogDescription>
                                Choose an open slot derived from your operating hours.
                            </DialogDescription>
                        </DialogHeader>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                                No available slots in the next 7 days. Check operating hours and capacity.
                            </p>
                        ) : (
                            <div className="grid gap-2 py-2">
                                <Label htmlFor="slotSelect">Available slots</Label>
                                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                                    <SelectTrigger id="slotSelect">
                                        <SelectValue placeholder="Select a slot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {slots.map((slot) => (
                                            <SelectItem key={slot.slot_start} value={slot.slot_start}>
                                                {formatSlotOptionLabel(slot)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleReschedule}
                                disabled={isSaving || !selectedSlot || slots.length === 0}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save slot"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
