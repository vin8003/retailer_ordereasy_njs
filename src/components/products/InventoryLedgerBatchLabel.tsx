import { cn } from "@/lib/utils";
import {
    getInventoryLedgerBatchIdLabel,
    type InventoryLedgerBatchDisplay,
} from "@/utils/inventoryLedgerBatch";

/** Muted inventory-ledger batch line. Renders nothing when BE omitted `batch_id`. */
export function InventoryLedgerBatchLabel({
    row,
    className,
}: {
    row: InventoryLedgerBatchDisplay;
    className?: string;
}) {
    const label = getInventoryLedgerBatchIdLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Batch ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Batch {label}
        </div>
    );
}
