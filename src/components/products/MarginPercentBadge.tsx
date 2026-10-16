import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMarginPercentLabel, type MarginDisplayProduct } from "@/utils/marginPercent";

/** Compact catalog/POS badge. Renders nothing when BE omitted `margin_percent`. */
export function MarginPercentBadge({
    product,
    className,
}: {
    product: MarginDisplayProduct;
    className?: string;
}) {
    const label = getMarginPercentLabel(product);
    if (!label) return null;

    return (
        <Badge
            variant="outline"
            aria-label={`Margin ${label}`}
            className={cn(
                "text-[10px] px-1.5 py-0 h-4 font-medium text-muted-foreground border-border/60",
                className
            )}
        >
            {label}
        </Badge>
    );
}
