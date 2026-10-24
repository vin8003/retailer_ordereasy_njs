import { cn } from "@/lib/utils";
import {
    getPurchaseReturnInvoiceNumber,
    type PurchaseReturnInvoiceDisplay,
} from "@/utils/purchaseReturnInvoiceNumber";

/** Muted "Against {invoice}" on purchase-return list rows. Renders nothing when BE omitted `invoice_number`. */
export function PurchaseReturnInvoiceLabel({
    purchaseReturn,
    className,
}: {
    purchaseReturn: PurchaseReturnInvoiceDisplay;
    className?: string;
}) {
    const invoiceNumber = getPurchaseReturnInvoiceNumber(purchaseReturn);
    if (!invoiceNumber) return null;

    return (
        <span
            aria-label={`Against ${invoiceNumber}`}
            className={cn("text-[10px] text-red-400 font-medium mt-0.5", className)}
        >
            Against {invoiceNumber}
        </span>
    );
}
