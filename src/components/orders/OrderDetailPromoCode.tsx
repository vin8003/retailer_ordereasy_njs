import { cn } from "@/lib/utils";
import {
    getOrderDetailPromoCode,
    type OrderDetailPromoCodeDisplay,
} from "@/utils/orderDetailPromoCode";

/** Muted retailer order-detail promo. Renders nothing when BE omitted `promo_code`. */
export function OrderDetailPromoCode({
    order,
    className,
}: {
    order: OrderDetailPromoCodeDisplay;
    className?: string;
}) {
    const code = getOrderDetailPromoCode(order);
    if (!code) return null;

    return (
        <div
            aria-label={`Promo ${code}`}
            className={cn("text-sm text-muted-foreground font-normal truncate", className)}
        >
            Promo {code}
        </div>
    );
}
