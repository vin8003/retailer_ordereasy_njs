import { cn } from "@/lib/utils";
import { getCustomerCodeLabel, type OrderCustomerCodeDisplay } from "@/utils/orderCustomerCode";

/** Muted order-list secondary under customer name. Renders nothing when BE omitted `customer_code`. */
export function OrderCustomerCode({
    order,
    className,
}: {
    order: OrderCustomerCodeDisplay;
    className?: string;
}) {
    const label = getCustomerCodeLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Customer code ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
