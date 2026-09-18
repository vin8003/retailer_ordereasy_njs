import { cn } from "@/lib/utils";
import {
    getOrderDetailChannelLabel,
    type OrderDetailChannelDisplay,
} from "@/utils/orderDetailChannel";

/** Muted retailer order-detail channel. Renders nothing when BE omitted `channel`. */
export function OrderDetailChannelLabel({
    order,
    className,
}: {
    order: OrderDetailChannelDisplay;
    className?: string;
}) {
    const label = getOrderDetailChannelLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Channel ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Channel {label}
        </div>
    );
}
