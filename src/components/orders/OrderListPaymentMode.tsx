import { cn } from "@/lib/utils";
import {
    getOrderPaymentModeLabel,
    type OrderListPaymentModeDisplay,
} from "@/utils/orderListPaymentMode";

/** Muted order-list payment mode. Renders nothing when BE omitted the scalar. */
export function OrderListPaymentMode({
    order,
    className,
}: {
    order: OrderListPaymentModeDisplay;
    className?: string;
}) {
    const label = getOrderPaymentModeLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Payment mode ${label}`}
            className={cn(
                "text-xs text-muted-foreground font-normal truncate uppercase",
                className
            )}
        >
            Mode: {label}
        </div>
    );
}
