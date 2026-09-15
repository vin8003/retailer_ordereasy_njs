export const ALLOWED_GST_RATES = [0, 3, 5, 18, 40] as const;

export interface InclusiveReturnTaxRow {
  quantity: number;
  unitPrice: number;
  gstRate: number | string;
  productGstRate?: number | string;
}

export interface InclusiveReturnTaxTotals {
  taxableAmount: number;
  taxAmount: number;
  inclusiveTotal: number;
  rateCoerced: boolean;
}

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function isAllowedGstRate(rate: number): boolean {
  return (ALLOWED_GST_RATES as readonly number[]).includes(rate);
}

export function resolveReturnGstRate(
  snapshotRate: number | string | undefined,
  productRate?: number | string,
): { rate: number; coerced: boolean } {
  const snapshot = Number(snapshotRate);
  if (Number.isFinite(snapshot) && isAllowedGstRate(snapshot)) {
    return { rate: snapshot, coerced: false };
  }

  const product = Number(productRate);
  if (Number.isFinite(product) && isAllowedGstRate(product)) {
    return { rate: product, coerced: true };
  }

  const hadInvalidSnapshot = Number.isFinite(snapshot) && snapshot !== 0;
  const hadInvalidProduct = Number.isFinite(product) && product !== 0;
  return { rate: 0, coerced: hadInvalidSnapshot || hadInvalidProduct };
}

export function calculateInclusiveReturnTax(
  rows: InclusiveReturnTaxRow[],
): InclusiveReturnTaxTotals {
  let taxableAmount = 0;
  let taxAmount = 0;
  let inclusiveTotal = 0;
  let rateCoerced = false;

  for (const row of rows) {
    const lineTotal = roundCurrency(row.quantity * row.unitPrice);
    const { rate: gstRate, coerced } = resolveReturnGstRate(
      row.gstRate,
      row.productGstRate,
    );
    rateCoerced = rateCoerced || coerced;
    const taxableValue = roundCurrency(lineTotal / (1 + gstRate / 100));
    const lineTax = roundCurrency(lineTotal - taxableValue);
    taxableAmount += taxableValue;
    taxAmount += lineTax;
    inclusiveTotal += lineTotal;
  }

  return {
    taxableAmount: roundCurrency(taxableAmount),
    taxAmount: roundCurrency(taxAmount),
    inclusiveTotal: roundCurrency(inclusiveTotal),
    rateCoerced,
  };
}
