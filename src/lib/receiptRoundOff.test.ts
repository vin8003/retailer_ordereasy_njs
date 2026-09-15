import { describe, expect, it } from 'vitest';

import {
  calculateReceiptRoundOff,
  shouldShowReceiptRoundOff,
} from './receiptRoundOff';

describe('calculateReceiptRoundOff', () => {
  it('reports zero when delivery is printed separately (not mislabeled as round off)', () => {
    expect(calculateReceiptRoundOff({
      totalAmount: 138,
      taxableAmount: 100,
      taxAmount: 18,
      deliveryFee: 20,
    })).toBe(0);
  });

  it('reports zero when points discount is printed separately', () => {
    expect(calculateReceiptRoundOff({
      totalAmount: 128,
      taxableAmount: 100,
      taxAmount: 18,
      deliveryFee: 20,
      discountFromPoints: 10,
    })).toBe(0);
  });

  it('reports rupee-rounding residue for POS-style totals', () => {
    expect(calculateReceiptRoundOff({
      totalAmount: 168,
      taxableAmount: 150.34,
      taxAmount: 18.06,
    })).toBe(-0.4);
  });
});

describe('shouldShowReceiptRoundOff', () => {
  it('hides negligible residue', () => {
    expect(shouldShowReceiptRoundOff(0)).toBe(false);
    expect(shouldShowReceiptRoundOff(0.004)).toBe(false);
    expect(shouldShowReceiptRoundOff(-0.4)).toBe(true);
  });
});
