import { cn } from "@/lib/utils";
import {
    getPurchaseDetailEwayBill,
    type PurchaseDetailEwayBillDisplay,
} from "@/utils/purchaseDetailEwayBill";

/** Purchase-detail e-way bill block. Renders nothing when BE omitted `eway_bill`. */
export function PurchaseDetailEwayBill({
    invoice,
    className,
}: {
    invoice: PurchaseDetailEwayBillDisplay;
    className?: string;
}) {
    const label = getPurchaseDetailEwayBill(invoice);
    if (!label) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                E-way bill
            </div>
            <div
                aria-label={`E-way bill ${label}`}
                className="text-sm text-muted-foreground font-medium"
            >
                {label}
            </div>
        </div>
    );
}
