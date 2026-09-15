import { describe, expect, it } from 'vitest';

import {
  calculateInclusiveReturnTax,
  isAllowedGstRate,
  resolveReturnGstRate,
} from './returnTax';

describe('returnTax', () => {
  it('splits selected return lines while preserving the inclusive total', () => {
    expect(calculateInclusiveReturnTax([
      { quantity: 2, unitPrice: 118, gstRate: 18 },
      { quantity: 1, unitPrice: 105, gstRate: 5 },
    ])).toEqual({
      taxableAmount: 300,
      taxAmount: 41,
      inclusiveTotal: 341,
      rateCoerced: false,
    });
  });

  it('falls back to product rate when snapshot rate is invalid', () => {
    expect(resolveReturnGstRate(12, 18)).toEqual({ rate: 18, coerced: true });
    expect(calculateInclusiveReturnTax([
      { quantity: 1, unitPrice: 118, gstRate: 12, productGstRate: 18 },
    ])).toEqual({
      taxableAmount: 100,
      taxAmount: 18,
      inclusiveTotal: 118,
      rateCoerced: true,
    });
  });

  it('uses zero when neither snapshot nor product rate is allowed', () => {
    expect(resolveReturnGstRate(12, 7)).toEqual({ rate: 0, coerced: true });
    expect(calculateInclusiveReturnTax([
      { quantity: 1, unitPrice: 100, gstRate: 12, productGstRate: 7 },
    ])).toEqual({
      taxableAmount: 100,
      taxAmount: 0,
      inclusiveTotal: 100,
      rateCoerced: true,
    });
  });

  it('accepts only backend-supported gst rates', () => {
    expect(isAllowedGstRate(18)).toBe(true);
    expect(isAllowedGstRate(12)).toBe(false);
  });
});
