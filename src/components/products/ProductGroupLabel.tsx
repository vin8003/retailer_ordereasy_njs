import { cn } from "@/lib/utils";
import { getProductGroupLabel, type ProductIdentityDisplay } from "@/utils/productIdentity";

/** Muted catalog/POS secondary near name/brand. Renders nothing when BE omitted `product_group`. */
export function ProductGroupLabel({
    product,
    className,
}: {
    product: ProductIdentityDisplay;
    className?: string;
}) {
    const label = getProductGroupLabel(product);
    if (!label) return null;

    return (
        <div
            aria-label={`Product group ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
