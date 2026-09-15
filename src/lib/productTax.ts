export const GST_RATE_OPTIONS = [0, 3, 5, 18, 40] as const;

export type GstRate = (typeof GST_RATE_OPTIONS)[number];

export function shouldRecommendHsn(
  gstRate: number | string,
  hsnCode: string,
): boolean {
  return Number(gstRate) > 0 && !hsnCode.trim();
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
