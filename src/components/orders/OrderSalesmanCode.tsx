import { cn } from "@/lib/utils";
import { getSalesmanCodeLabel, type OrderSalesmanCodeDisplay } from "@/utils/orderSalesmanCode";

/** Muted order-list secondary under order #. Renders nothing when BE omitted `salesman_code`. */
export function OrderSalesmanCode({
    order,
    className,
}: {
    order: OrderSalesmanCodeDisplay;
    className?: string;
}) {
    const label = getSalesmanCodeLabel(order);
    if (!label) return null;

    return (
        <div
            aria-label={`Salesman code ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
