import { cn } from "@/lib/utils";
import {
    getSupplierGstNumber,
    getSupplierPaymentTerms,
    type SupplierListScalarDisplay,
} from "@/utils/supplierListScalars";

/** Muted supplier-list secondary under company name. Renders nothing when BE omitted the scalars. */
export function SupplierListScalars({
    supplier,
    className,
}: {
    supplier: SupplierListScalarDisplay;
    className?: string;
}) {
    const gst = getSupplierGstNumber(supplier);
    const terms = getSupplierPaymentTerms(supplier);
    if (!gst && !terms) return null;

    return (
        <div className={cn("flex flex-col text-xs text-muted-foreground font-normal", className)}>
            {gst ? (
                <div aria-label={`GSTIN ${gst}`} className="truncate">
                    GSTIN {gst}
                </div>
            ) : null}
            {terms ? (
                <div aria-label={`Payment terms ${terms}`} className="truncate">
                    Terms {terms}
                </div>
            ) : null}
        </div>
    );
}
