import { cn } from "@/lib/utils";
import {
    getPurchaseReturnLrNumber,
    type PurchaseReturnLrDisplay,
} from "@/utils/purchaseReturnLrNumber";

/** Muted purchase-return list LR line. Renders nothing when BE omitted `lr_number`. */
export function PurchaseReturnLrNumber({
    row,
    className,
}: {
    row: PurchaseReturnLrDisplay;
    className?: string;
}) {
    const label = getPurchaseReturnLrNumber(row);
    if (!label) return null;

    return (
        <div
            aria-label={`LR ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            LR {label}
        </div>
    );
}
