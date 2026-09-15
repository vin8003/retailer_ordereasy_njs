export interface PurchaseTaxRow {
  total: number;
  gstRate: number | string;
}

export interface PurchaseTaxTotals {
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
  /** grandTotal - (taxableAmount + taxAmount), from nearest-rupee rounding. */
  roundOff: number;
}

interface PurchaseTaxSnapshotSource {
  gst_rate?: number | string;
  hsn_code?: string;
}

export interface PurchaseTaxSnapshot {
  gstRate: number;
  hsnCode: string;
}

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function purchaseTaxSnapshot(
  source: PurchaseTaxSnapshotSource,
): PurchaseTaxSnapshot {
  return {
    gstRate: Number(source.gst_rate) || 0,
    hsnCode: source.hsn_code || '',
  };
}

export function calculatePurchaseTax(rows: PurchaseTaxRow[]): PurchaseTaxTotals {
  let taxableAmount = 0;
  let taxAmount = 0;
  let inclusiveTotal = 0;

  for (const row of rows) {
    const lineTotal = roundCurrency(Number(row.total) || 0);
    const gstRate = Number(row.gstRate) || 0;
    const taxableValue = roundCurrency(lineTotal / (1 + gstRate / 100));
    const lineTax = roundCurrency(lineTotal - taxableValue);

    taxableAmount += taxableValue;
    taxAmount += lineTax;
    inclusiveTotal += lineTotal;
  }

  const roundedTaxable = roundCurrency(taxableAmount);
  const roundedTax = roundCurrency(taxAmount);
  const grandTotal = Math.round(inclusiveTotal);

  return {
    taxableAmount: roundedTaxable,
    taxAmount: roundedTax,
    grandTotal,
    roundOff: roundCurrency(grandTotal - (roundedTaxable + roundedTax)),
  };
}

function gstinStateCode(gstin?: string): string | null {
  const normalized = (gstin || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^\d{2}/.test(normalized) ? normalized.slice(0, 2) : null;
}

export function resolvePurchaseTaxType(
  retailerGstin?: string,
  supplierGstin?: string,
): 'GST' | 'IGST' {
  const retailerState = gstinStateCode(retailerGstin);
  const supplierState = gstinStateCode(supplierGstin);
  return retailerState && supplierState && retailerState !== supplierState
    ? 'IGST'
    : 'GST';
}
