import { cn } from "@/lib/utils";
import {
    getLastSupplierCostHint,
    type LastSupplierCostsPayload,
} from "@/utils/lastSupplierCost";

/** Muted last-cost line under inward price. Renders nothing when BE omitted the scalar. */
export function LastSupplierCostHint({
    payload,
    supplierId,
    className,
}: {
    payload?: LastSupplierCostsPayload | null;
    supplierId?: number | string | null;
    className?: string;
}) {
    const label = getLastSupplierCostHint(payload, supplierId);
    if (!label) return null;

    const amount = label.replace(/^Last\s+/, "");

    return (
        <div
            aria-label={`Last supplier cost ${amount}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
