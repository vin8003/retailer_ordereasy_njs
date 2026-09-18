import { cn } from "@/lib/utils";
import {
    getInventoryLedgerCreatedByName,
    type InventoryLedgerCreatedByDisplay,
} from "@/utils/inventoryLedgerCreatedBy";

/** Muted inventory-ledger created-by name. Renders nothing when BE omitted `created_by_name`. */
export function InventoryLedgerCreatedByName({
    row,
    className,
}: {
    row: InventoryLedgerCreatedByDisplay;
    className?: string;
}) {
    const name = getInventoryLedgerCreatedByName(row);
    if (!name) return null;

    return (
        <div
            aria-label={`Created by ${name}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            {name}
        </div>
    );
}
