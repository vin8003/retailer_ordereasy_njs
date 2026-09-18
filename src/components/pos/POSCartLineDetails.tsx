import { BrandNameLabel } from "@/components/products/BrandNameLabel";
import { pickPosCartLineBrandName } from "@/utils/posCartLineBrand";

export type POSCartLineDetailsItem = {
    name: string;
    brand_name?: string | null;
    batch_name?: string | null;
    /** Allowed on payloads / tests; never used to invent brand_name. */
    brand?: { name?: string | null } | null;
};

/** Item name + optional muted brand on a POS cart line. Batch unchanged. */
export function POSCartLineDetails({ item }: { item: POSCartLineDetailsItem }) {
    const brandName = pickPosCartLineBrandName(item);

    return (
        <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</span>
            {brandName ? <BrandNameLabel product={{ brand_name: brandName }} /> : null}
            {item.batch_name ? (
                <span className="text-[10px] text-primary font-bold uppercase mt-0.5 tracking-tighter">
                    Batch: {item.batch_name}
                </span>
            ) : null}
        </div>
    );
}
