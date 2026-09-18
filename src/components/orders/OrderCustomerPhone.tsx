import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getOrderCustomerPhoneLabel,
    type OrderCustomerPhoneDisplay,
} from "@/utils/orderCustomerPhone";

/** Order-detail customer-block phone. Renders nothing when BE omitted a usable phone. */
export function OrderCustomerPhone({
    order,
    className,
}: {
    order: OrderCustomerPhoneDisplay;
    className?: string;
}) {
    const phone = getOrderCustomerPhoneLabel(order);
    if (!phone) return null;

    return (
        <div
            aria-label={`Phone ${phone}`}
            className={cn("flex items-center gap-2", className)}
        >
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{phone}</span>
        </div>
    );
}
