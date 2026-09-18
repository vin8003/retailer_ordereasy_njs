import { cn } from "@/lib/utils";
import {
    getDeliveryFeeLine,
    getDiscountAmountLine,
    type OrderFeeDiscountDisplay,
} from "@/utils/orderFeeDiscount";

/** Compact muted fee/discount lines near order-list total. Missing/null/0 → nothing. */
export function OrderFeeDiscountLines({
    order,
    className,
}: {
    order: OrderFeeDiscountDisplay;
    className?: string;
}) {
    const fee = getDeliveryFeeLine(order);
    const discount = getDiscountAmountLine(order);
    if (!fee && !discount) return null;

    return (
        <div
            className={cn(
                "flex flex-col items-end text-[10px] text-muted-foreground font-medium leading-tight mt-0.5",
                className
            )}
        >
            {fee ? <span>{fee}</span> : null}
            {discount ? <span>{discount}</span> : null}
        </div>
    );
}
