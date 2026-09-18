import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPaymentModeLabel, type OrderPaymentModeDisplay } from "@/utils/orderPaymentMode";

/** Payment-block method row. Renders nothing when BE omitted `payment_mode`. */
export function PaymentModeLabel({
    order,
    className,
}: {
    order: OrderPaymentModeDisplay;
    className?: string;
}) {
    const label = getPaymentModeLabel(order);
    if (!label) return null;

    return (
        <div className={cn("flex justify-between items-center", className)}>
            <span className="text-sm text-muted-foreground">Method:</span>
            <Badge
                variant="outline"
                aria-label={`Payment mode ${label}`}
                className="font-bold border-primary/30 text-primary"
            >
                {label.toUpperCase()}
            </Badge>
        </div>
    );
}
