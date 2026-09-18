import { cn } from "@/lib/utils";
import {
    getInventoryAdjustRackLocationLabel,
    type InventoryAdjustRackLocationDisplay,
} from "@/utils/inventoryAdjustRackLocation";

/** Muted inventory-adjust history rack line. Renders nothing when BE omitted `rack_location`. */
export function InventoryAdjustRackLocationLabel({
    row,
    className,
}: {
    row: InventoryAdjustRackLocationDisplay;
    className?: string;
}) {
    const label = getInventoryAdjustRackLocationLabel(row);
    if (!label) return null;

    return (
        <div
            aria-label={`Rack ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            Rack {label}
        </div>
    );
}
