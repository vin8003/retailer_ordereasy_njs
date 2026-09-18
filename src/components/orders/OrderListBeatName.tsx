import { cn } from "@/lib/utils";
import {
    getOrderBeatNameLabel,
    type OrderListBeatNameDisplay,
} from "@/utils/orderListBeatName";

/** Muted order-list beat line. Renders nothing when BE omitted `beat_name`. */
export function OrderListBeatName({
    order,
    className,
}: {
    order: OrderListBeatNameDisplay;
    className?: string;
}) {
    const label = getOrderBeatNameLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Beat ${label}`}
            className={cn(
                "text-xs text-muted-foreground font-normal truncate",
                className
            )}
        >
            Beat {label}
        </div>
    );
}
