import { cn } from "@/lib/utils";
import {
    getOrderDetailSalesmanName,
    type OrderDetailSalesmanNameDisplay,
} from "@/utils/orderDetailSalesmanName";

/** Muted retailer order-detail salesman. Renders nothing when BE omitted `salesman_name`. */
export function OrderDetailSalesmanName({
    order,
    className,
}: {
    order: OrderDetailSalesmanNameDisplay;
    className?: string;
}) {
    const name = getOrderDetailSalesmanName(order);
    if (!name) return null;

    return (
        <div
            aria-label={`Salesman ${name}`}
            className={cn("text-sm text-muted-foreground font-normal truncate", className)}
        >
            Salesman {name}
        </div>
    );
}
