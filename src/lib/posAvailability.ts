/** OE-190 / F-0017 — BE rejects an inactive product on POS sale; FE only reads that reject. */

/**
 * BE copy (create_pos_order / pos-checkout, 400):
 * `Product '<name>' (id=<id>) is inactive or unavailable and cannot be sold.`
 * Parsed, never reconstructed — there is no saleable_* field to ask for.
 */
const UNSELLABLE_PRODUCT_PATTERN =
  /product\s+'(.*)'\s*\(\s*id\s*=\s*(\d+)\s*\)\s*is\s+inactive\s+or\s+unavailable\s+and\s+cannot\s+be\s+sold/i;

export const UNSELLABLE_PRODUCT_HINT = "Remove it from the cart to complete this bill.";
export const INACTIVE_PRODUCT_ADD_MESSAGE =
  "This product is inactive and cannot be added to a sale.";

export interface UnsellableProduct {
  productId: number;
  name: string;
}

/** Active unless the catalog says otherwise (POS list is already an is_active=true fetch). */
export function isSellableProduct(
  product: { is_active?: boolean } | null | undefined
): boolean {
  if (!product) return false;
  return product.is_active !== false;
}

export function parseUnsellableProductError(
  message: string | null | undefined
): UnsellableProduct | null {
  const match = UNSELLABLE_PRODUCT_PATTERN.exec(String(message ?? ""));
  if (!match) return null;
  const productId = Number(match[2]);
  if (!Number.isFinite(productId) || productId <= 0) return null;
  return { productId, name: match[1].trim() };
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim()) return entry;
    }
  }
  return undefined;
}

/** POS reads data.error today; detail / non_field_errors are the other DRF shapes. */
export function checkoutErrorText(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  return (
    firstString(d.error) ??
    firstString(d.detail) ??
    firstString(d.non_field_errors) ??
    ""
  );
}

export function axiosUnsellableProduct(err: {
  response?: { status?: number; data?: unknown };
}): UnsellableProduct | null {
  if (err.response?.status !== 400) return null;
  return parseUnsellableProductError(checkoutErrorText(err.response.data));
}

export function inactiveProductAddToast(
  product: { name?: string } | null | undefined
): string {
  const label = product?.name?.trim();
  return label ? `${label}: ${INACTIVE_PRODUCT_ADD_MESSAGE}` : INACTIVE_PRODUCT_ADD_MESSAGE;
}

export function unsellableProductMessage(hit: UnsellableProduct): string {
  const label = hit.name || `Product #${hit.productId}`;
  return `${label} is inactive or unavailable and cannot be sold. ${UNSELLABLE_PRODUCT_HINT}`;
}

/** Keep the banner only while the rejected product is still in the cart. */
export function unsellableCartHit<T extends { id: number }>(
  cart: ReadonlyArray<T>,
  hit: UnsellableProduct | null | undefined
): UnsellableProduct | null {
  if (!hit) return null;
  return cart.some((item) => item.id === hit.productId) ? hit : null;
}

export function cartWithoutProduct<T extends { id: number }>(
  cart: ReadonlyArray<T>,
  productId: number
): T[] {
  return cart.filter((item) => item.id !== productId);
}
