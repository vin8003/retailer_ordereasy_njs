import { cn } from "@/lib/utils";
import { getBarcodeLabel, type ProductIdentityDisplay } from "@/utils/productIdentity";

/** Compact muted catalog/POS barcode. Renders nothing when BE omitted `barcode`. */
export function BarcodeLabel({
    product,
    className,
}: {
    product: ProductIdentityDisplay;
    className?: string;
}) {
    const label = getBarcodeLabel(product);
    if (!label) return null;

    return (
        <div
            aria-label={`Barcode ${label}`}
            className={cn("text-[10px] text-muted-foreground font-normal truncate tracking-wide", className)}
        >
            {label}
        </div>
    );
}
