import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    getOutOfStockLabel,
    getUnavailableLabel,
    type AvailabilityDisplayProduct,
} from "@/utils/availabilityFlags";

const mutedBadgeClass =
    "text-[10px] px-1.5 py-0 h-4 font-medium text-muted-foreground border-border/60";

/** Compact catalog/POS badges. Renders nothing unless BE sent a strict `false` flag. */
export function AvailabilityBadges({
    product,
    className,
}: {
    product: AvailabilityDisplayProduct;
    className?: string;
}) {
    const unavailable = getUnavailableLabel(product);
    const outOfStock = getOutOfStockLabel(product);
    if (!unavailable && !outOfStock) return null;

    return (
        <div className={cn("flex flex-wrap gap-1", className)}>
            {unavailable ? (
                <Badge
                    variant="outline"
                    aria-label="Unavailable product"
                    className={mutedBadgeClass}
                >
                    {unavailable}
                </Badge>
            ) : null}
            {outOfStock ? (
                <Badge
                    variant="outline"
                    aria-label="Out of stock product"
                    className={mutedBadgeClass}
                >
                    {outOfStock}
                </Badge>
            ) : null}
        </div>
    );
}
