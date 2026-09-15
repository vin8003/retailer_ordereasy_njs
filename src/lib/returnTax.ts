export interface InclusiveReturnTaxRow {
  quantity: number;
  unitPrice: number;
  gstRate: number | string;
}

export interface InclusiveReturnTaxTotals {
  taxableAmount: number;
  taxAmount: number;
  inclusiveTotal: number;
}

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateInclusiveReturnTax(
  rows: InclusiveReturnTaxRow[],
): InclusiveReturnTaxTotals {
  let taxableAmount = 0;
  let taxAmount = 0;
  let inclusiveTotal = 0;

  for (const row of rows) {
    const lineTotal = roundCurrency(row.quantity * row.unitPrice);
    const gstRate = Number(row.gstRate) || 0;
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
  };
}
