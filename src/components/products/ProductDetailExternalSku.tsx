import { cn } from "@/lib/utils";
import {
    getExternalSkuLabel,
    type ProductDetailExternalSkuDisplay,
} from "@/utils/productDetailExternalSku";

/** Muted product-detail external SKU. Renders nothing when BE omitted `external_sku`. `asin` is a noop. */
export function ProductDetailExternalSku({
    product,
    className,
}: {
    product: ProductDetailExternalSkuDisplay;
    className?: string;
}) {
    const label = getExternalSkuLabel(product);
    if (!label) return null;

    return (
        <div
            aria-label={`External SKU ${label}`}
            className={cn("text-xs text-muted-foreground font-normal truncate", className)}
        >
            External SKU {label}
        </div>
    );
}
