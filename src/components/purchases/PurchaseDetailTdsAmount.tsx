import { cn } from "@/lib/utils";
import {
    getPurchaseDetailTdsAmountLabel,
    type PurchaseDetailTdsDisplay,
} from "@/utils/purchaseDetailTds";

/** Purchase-detail TDS block. Renders nothing when BE omitted or blanked `tds_amount`. */
export function PurchaseDetailTdsAmount({
    invoice,
    className,
}: {
    invoice: PurchaseDetailTdsDisplay;
    className?: string;
}) {
    const label = getPurchaseDetailTdsAmountLabel(invoice);
    if (!label) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">TDS</div>
            <div
                aria-label={`TDS ${label}`}
                className="text-sm text-gray-700 font-medium"
            >
                {label}
            </div>
        </div>
    );
}
