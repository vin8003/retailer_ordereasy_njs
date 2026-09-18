import { cn } from "@/lib/utils";
import {
    getPurchaseDetailLrDate,
    type PurchaseDetailLrDateDisplay,
} from "@/utils/purchaseDetailLrDate";

/** Purchase-detail LR date block. Renders nothing when BE omitted `lr_date`. */
export function PurchaseDetailLrDate({
    invoice,
    className,
}: {
    invoice: PurchaseDetailLrDateDisplay;
    className?: string;
}) {
    const label = getPurchaseDetailLrDate(invoice);
    if (!label) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                LR Date
            </div>
            <div
                aria-label={`LR Date ${label}`}
                className="text-sm text-muted-foreground font-medium"
            >
                {label}
            </div>
        </div>
    );
}
