import { cn } from "@/lib/utils";
import {
    getOrderListRouteNameLabel,
    type OrderListRouteNameDisplay,
} from "@/utils/orderListRouteName";

/** Muted order-list route line. Renders nothing when BE omitted `route_name`. */
export function OrderListRouteNameLabel({
    order,
    className,
}: {
    order: OrderListRouteNameDisplay;
    className?: string;
}) {
    const label = getOrderListRouteNameLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Route ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            {label}
        </div>
    );
}
