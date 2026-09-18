import { cn } from "@/lib/utils";
import {
    getPurchaseReturnCreatedAtTimeLabel,
    type PurchaseReturnListCreatedAtDisplay,
} from "@/utils/purchaseReturnListCreatedAt";

/** Muted purchase-return list clock time. Renders nothing when BE omitted created_at. */
export function PurchaseReturnCreatedAtTimeLabel({
    item,
    className,
}: {
    item: PurchaseReturnListCreatedAtDisplay;
    className?: string;
}) {
    const time = getPurchaseReturnCreatedAtTimeLabel(item);
    if (!time) return null;

    return (
        <div
            aria-label={`Created ${time}`}
            className={cn("text-xs text-muted-foreground font-normal", className)}
        >
            {time}
        </div>
    );
}
