import { cn } from "@/lib/utils";
import { getPurchaseInvoiceNotes, type PurchaseInvoiceNotesDisplay } from "@/utils/purchaseInvoiceNotes";

/** Muted purchase-list secondary under invoice number. Renders nothing when BE omitted `notes`. */
export function PurchaseInvoiceNotes({
    invoice,
    className,
}: {
    invoice: PurchaseInvoiceNotesDisplay;
    className?: string;
}) {
    const notes = getPurchaseInvoiceNotes(invoice);
    if (!notes) return null;

    return (
        <div
            aria-label={`Notes ${notes}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {notes}
        </div>
    );
}
