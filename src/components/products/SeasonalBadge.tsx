import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSeasonalLabel, type SeasonalDisplayProduct } from "@/utils/seasonalFlag";

/** Compact catalog/POS badge. Renders nothing unless BE sent `is_seasonal === true`. */
export function SeasonalBadge({
    product,
    className,
}: {
    product: SeasonalDisplayProduct;
    className?: string;
}) {
    const label = getSeasonalLabel(product);
    if (!label) return null;

    return (
        <Badge
            variant="outline"
            aria-label="Seasonal product"
            className={cn(
                "text-[10px] px-1.5 py-0 h-4 font-medium text-muted-foreground border-border/60",
                className
            )}
        >
            {label}
        </Badge>
    );
}
