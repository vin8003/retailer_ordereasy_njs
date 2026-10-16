import { cn } from "@/lib/utils";
import { getBrandNameLabel, type ProductIdentityDisplay } from "@/utils/productIdentity";

/** Muted catalog/POS secondary under the product name. Renders nothing when BE omitted `brand_name`. */
export function BrandNameLabel({
    product,
    className,
}: {
    product: ProductIdentityDisplay;
    className?: string;
}) {
    const label = getBrandNameLabel(product);
    if (!label) return null;

    return (
        <div
            aria-label={`Brand ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            {label}
        </div>
    );
}
