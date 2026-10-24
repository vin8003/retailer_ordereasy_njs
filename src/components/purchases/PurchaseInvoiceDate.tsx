import { cn } from "@/lib/utils";
import {
    getPurchaseInvoiceDate,
    type PurchaseInvoiceDateDisplay,
} from "@/utils/purchaseInvoiceDate";

/** Muted purchase-list secondary under invoice number. Renders nothing when BE omitted `invoice_date`. */
export function PurchaseInvoiceDate({
    invoice,
    className,
}: {
    invoice: PurchaseInvoiceDateDisplay;
    className?: string;
}) {
    const label = getPurchaseInvoiceDate(invoice);
    if (!label) return null;

    return (
        <div
            aria-label={`Invoice date ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
