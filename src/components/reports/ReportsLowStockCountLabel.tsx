import { cn } from "@/lib/utils";
import {
    getLowStockCountLabel,
    type ReportsLowStockCountDisplay,
} from "@/utils/reportLowStockCount";

/** Muted reports header line. Renders nothing when BE omitted `low_stock_count`. */
export function ReportsLowStockCountLabel({
    summary,
    className,
}: {
    summary: ReportsLowStockCountDisplay;
    className?: string;
}) {
    const label = getLowStockCountLabel(summary);
    if (!label) return null;

    return (
        <p
            data-testid="reports-low-stock-count"
            aria-label={label}
            className={cn("text-xs sm:text-sm font-medium text-gray-500", className)}
        >
            {label}
        </p>
    );
}
