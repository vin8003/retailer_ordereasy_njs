import { cn } from "@/lib/utils";
import { getPurchaseDetailIrn, type PurchaseDetailIrnDisplay } from "@/utils/purchaseDetailIrn";

/** Purchase-detail IRN block. Renders nothing when BE omitted `irn`. */
export function PurchaseDetailIrn({
    invoice,
    className,
}: {
    invoice: PurchaseDetailIrnDisplay;
    className?: string;
}) {
    const label = getPurchaseDetailIrn(invoice);
    if (!label) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">IRN</div>
            <div
                aria-label={`IRN ${label}`}
                className="text-sm text-muted-foreground font-medium break-all"
            >
                {label}
            </div>
        </div>
    );
}
