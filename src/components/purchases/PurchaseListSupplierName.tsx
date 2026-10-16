import { cn } from "@/lib/utils";
import {
    getPurchaseListSupplierName,
    type PurchaseListSupplierNameDisplay,
} from "@/utils/purchaseListSupplierName";

/** Purchase-list supplier cell. Renders nothing when BE omitted `supplier_name`. */
export function PurchaseListSupplierName({
    invoice,
    className,
}: {
    invoice: PurchaseListSupplierNameDisplay;
    className?: string;
}) {
    const name = getPurchaseListSupplierName(invoice);
    if (!name) return null;

    return (
        <span aria-label={`Supplier ${name}`} className={cn("truncate", className)}>
            {name}
        </span>
    );
}
