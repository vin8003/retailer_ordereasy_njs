export const GST_RATE_OPTIONS = [0, 3, 5, 18, 40] as const;

export type GstRate = (typeof GST_RATE_OPTIONS)[number];

export function shouldRecommendHsn(
  gstRate: number | string,
  hsnCode: string,
): boolean {
  return Number(gstRate) > 0 && !hsnCode.trim();
}

export function shouldRecommendBulkHsnWarning(
  gstRate: number | string,
  applyHsn: boolean,
  bulkHsnCode: string,
  products: Array<{ id: number; hsn_code?: string }>,
  changes: Record<number, { hsn_code?: string }> = {},
): boolean {
  if (Number(gstRate) <= 0) return false;

  if (applyHsn) {
    return !bulkHsnCode.trim();
  }

  return products.some((product) => {
    const effectiveHsn =
      changes[product.id]?.hsn_code !== undefined
        ? changes[product.id].hsn_code!
        : product.hsn_code || "";
    return !effectiveHsn.trim();
  });
}

export function buildBulkTaxChanges(
  productIds: number[],
  values: { hsnCode?: string; gstRate?: GstRate },
) {
  return productIds.map((id) => ({
    id,
    ...(values.hsnCode !== undefined ? { hsn_code: values.hsnCode } : {}),
    ...(values.gstRate !== undefined ? { gst_rate: values.gstRate } : {}),
  }));
}
