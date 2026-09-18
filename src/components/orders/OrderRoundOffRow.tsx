import { cn } from "@/lib/utils";
import {
    getOrderRoundOffLabel,
    type OrderRoundOffDisplay,
} from "@/utils/orderRoundOff";

/** Order-summary totals row. Renders nothing when BE omitted `round_off`. */
export function OrderRoundOffRow({
    order,
    className,
}: {
    order: OrderRoundOffDisplay;
    className?: string;
}) {
    const label = getOrderRoundOffLabel(order);
    if (!label) return null;

    return (
        <div className={cn("flex justify-between text-sm", className)}>
            <span className="text-muted-foreground">Round Off</span>
            <span aria-label={`Round off ${label}`}>{label}</span>
        </div>
    );
}
