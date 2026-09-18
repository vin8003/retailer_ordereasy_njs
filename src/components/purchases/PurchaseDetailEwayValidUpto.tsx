import { cn } from "@/lib/utils";
import {
    getPurchaseDetailEwayValidUpto,
    type PurchaseDetailEwayValidUptoDisplay,
} from "@/utils/purchaseDetailEwayValidUpto";

/** Purchase-detail e-way validity block. Renders nothing when BE omitted `eway_valid_upto`. */
export function PurchaseDetailEwayValidUpto({
    invoice,
    className,
}: {
    invoice: PurchaseDetailEwayValidUptoDisplay;
    className?: string;
}) {
    const label = getPurchaseDetailEwayValidUpto(invoice);
    if (!label) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                E-way valid upto
            </div>
            <div
                aria-label={`E-way valid upto ${label}`}
                className="text-sm text-muted-foreground font-medium"
            >
                {label}
            </div>
        </div>
    );
}
