import { getBrandNameLabel, type ProductIdentityDisplay } from "@/utils/productIdentity";

/** Cart-line / product payload that may carry optional top-level `brand_name`. */
export type PosCartLineBrandSource = ProductIdentityDisplay & {
    name?: string | null;
};

/**
 * Optional brand copied onto a POS cart line from top-level `brand_name` only.
 * Absent / undefined / null / blank → do not show. Never derived from nested `brand` or `name`.
 */
export function pickPosCartLineBrandName(item: PosCartLineBrandSource): string | null {
    return getBrandNameLabel(item);
}
