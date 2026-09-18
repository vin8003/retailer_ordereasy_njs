import { cn } from "@/lib/utils";
import {
    getPurchaseInvoicePoNumber,
    type PurchaseInvoicePoNumberDisplay,
} from "@/utils/purchaseInvoicePoNumber";

/** Muted purchase-list secondary under invoice number. Renders nothing when BE omitted `po_number`. */
export function PurchaseInvoicePoNumber({
    invoice,
    className,
}: {
    invoice: PurchaseInvoicePoNumberDisplay;
    className?: string;
}) {
    const label = getPurchaseInvoicePoNumber(invoice);
    if (!label) return null;

    return (
        <div
            aria-label={`PO ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            PO {label}
        </div>
    );
}
