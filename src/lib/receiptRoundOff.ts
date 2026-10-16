const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export interface ReceiptRoundOffInput {
  totalAmount: number | string;
  taxableAmount?: number | string;
  taxAmount?: number | string;
  deliveryFee?: number | string;
  discountFromPoints?: number | string;
}

/** Rupee-rounding residue after all printed receipt rows reconcile to TOTAL. */
export function calculateReceiptRoundOff({
  totalAmount,
  taxableAmount,
  taxAmount,
  deliveryFee,
  discountFromPoints,
}: ReceiptRoundOffInput): number {
  if (taxableAmount === undefined) {
    return 0;
  }

  const total = Number(totalAmount) || 0;
  const taxable = Number(taxableAmount) || 0;
  const tax = Number(taxAmount) || 0;
  const delivery = Number(deliveryFee) || 0;
  const pointsDiscount = Number(discountFromPoints) || 0;

  return roundCurrency(total - (taxable + tax + delivery - pointsDiscount));
}

export function shouldShowReceiptRoundOff(roundOff: number): boolean {
  return Math.abs(roundOff) >= 0.005;
}
