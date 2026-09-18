import { cn } from "@/lib/utils";
import {
    getStockTransferGodownName,
    type StockTransferGodownDisplay,
} from "@/utils/stockTransferGodown";

/** Muted stock-transfer godown line. Renders nothing when BE omitted `godown_name`. Ready to mount on a real stock-transfer list row when one exists. */
export function StockTransferGodownLabel({
    row,
    className,
}: {
    row: StockTransferGodownDisplay;
    className?: string;
}) {
    const name = getStockTransferGodownName(row);
    if (!name) return null;

    return (
        <div
            aria-label={`Godown ${name}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Godown {name}
        </div>
    );
}
