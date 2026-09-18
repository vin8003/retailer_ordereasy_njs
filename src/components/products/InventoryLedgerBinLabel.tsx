import { cn } from "@/lib/utils";
import {
    getInventoryLedgerBinCodeLabel,
    type InventoryLedgerBinDisplay,
} from "@/utils/inventoryLedgerBin";

/** Muted inventory-ledger bin line. Renders nothing when BE omitted `bin_code`. */
export function InventoryLedgerBinLabel({
    row,
    className,
}: {
    row: InventoryLedgerBinDisplay;
    className?: string;
}) {
    const label = getInventoryLedgerBinCodeLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Bin ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Bin {label}
        </div>
    );
}
