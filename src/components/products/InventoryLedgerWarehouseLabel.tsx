import { cn } from "@/lib/utils";
import {
    getInventoryLedgerWarehouseNameLabel,
    type InventoryLedgerWarehouseDisplay,
} from "@/utils/inventoryLedgerWarehouse";

/** Muted inventory-ledger warehouse line. Renders nothing when BE omitted `warehouse_name`. */
export function InventoryLedgerWarehouseLabel({
    row,
    className,
}: {
    row: InventoryLedgerWarehouseDisplay;
    className?: string;
}) {
    const label = getInventoryLedgerWarehouseNameLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Warehouse ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Warehouse {label}
        </div>
    );
}
