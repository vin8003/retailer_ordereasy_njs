/** OE-106 / F-0023 — store vs owned-app selling price (thin EXTEND). */

export const CHANNEL_STORE = "store";
export const CHANNEL_APP = "app";
export const PERM_CATALOG_PRICE = "catalog.price";

export type PriceChannel = typeof CHANNEL_STORE | typeof CHANNEL_APP;

export type Money = number | string | null | undefined;

export interface ChannelPricedProduct {
  price?: Money;
  app_price?: Money;
  discounted_price?: Money;
}

export interface ChannelPricedBatch {
  price?: Money;
}

export function parseMoney(value: Money): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatInrAmount(value: Money): string {
  const n = parseMoney(value);
  if (n == null) return "";
  return n.toFixed(2);
}

/** Owned-app list when set; otherwise store. Does not invent a PriceList. */
export function resolveChannelSellingPrice(
  product: ChannelPricedProduct,
  channel: PriceChannel,
  batch?: ChannelPricedBatch | null
): number | null {
  if (channel === CHANNEL_APP) {
    const app = parseMoney(product.app_price);
    if (app != null) return app;
  }
  const batchPrice = parseMoney(batch?.price);
  if (batchPrice != null) return batchPrice;
  return parseMoney(product.price);
}

/**
 * POS / counter unit price. Always store list (product.price or batch.price).
 * Never charges app_price at the register.
 */
export function posUnitPrice(
  product: ChannelPricedProduct,
  batch?: ChannelPricedBatch | null
): number {
  return resolveChannelSellingPrice(product, CHANNEL_STORE, batch) ?? 0;
}

export function hasDistinctAppPrice(product: ChannelPricedProduct): boolean {
  const app = parseMoney(product.app_price);
  if (app == null) return false;
  const store = parseMoney(product.price);
  return store == null || app !== store;
}

export function canEditAppPrice(
  permissions: ReadonlySet<string> | string[]
): boolean {
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return set.has(PERM_CATALOG_PRICE);
}

/** Only send app_price when catalog.price allows — avoids 403 on cashier edits. */
export function appendAppPriceToFormData(
  formData: FormData,
  appPrice: string,
  canEdit: boolean
): void {
  if (!canEdit) return;
  formData.append("app_price", appPrice.trim());
}

export function isCatalogPriceDenied(error: {
  response?: { status?: number; data?: { error?: string } };
}): boolean {
  if (error.response?.status !== 403) return false;
  const msg = error.response.data?.error ?? "";
  return /catalog price permission required/i.test(msg);
}

export function channelPriceLines(product: ChannelPricedProduct): {
  store: string;
  app?: string;
} {
  const store = formatInrAmount(product.price);
  if (!hasDistinctAppPrice(product)) return { store };
  return { store, app: formatInrAmount(product.app_price) };
}
