import { cn } from "@/lib/utils";
import {
    getSalesReturnCnNumberLabel,
    type SalesReturnCnNumberDisplay,
} from "@/utils/salesReturnCnNumber";

/** Muted sales-return-list credit-note line. Renders nothing when BE omitted `cn_number`. */
export function SalesReturnCnNumberLabel({
    salesReturn,
    className,
}: {
    salesReturn: SalesReturnCnNumberDisplay;
    className?: string;
}) {
    const label = getSalesReturnCnNumberLabel(salesReturn);
    if (!label) return null;

    return (
        <div
            aria-label={`Credit note ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            CN {label}
        </div>
    );
}
