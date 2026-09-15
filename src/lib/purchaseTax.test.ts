import { describe, expect, it } from 'vitest';

import { calculatePurchaseTax, resolvePurchaseTaxType } from './purchaseTax';

describe('calculatePurchaseTax', () => {
  it('splits GST-inclusive purchase rows and rounds the grand total to rupees', () => {
    expect(calculatePurchaseTax([
      { total: 118.4, gstRate: 18 },
      { total: 50, gstRate: 0 },
    ])).toEqual({
      taxableAmount: 150.34,
      taxAmount: 18.06,
      grandTotal: 168,
    });
  });
});

describe('resolvePurchaseTaxType', () => {
  it('uses IGST only when both valid GSTIN state codes differ', () => {
    expect(resolvePurchaseTaxType('27ABCDE1234F1Z5', '29ABCDE1234F1Z6')).toBe('IGST');
    expect(resolvePurchaseTaxType('27ABCDE1234F1Z5', '27ABCDE1234F1Z6')).toBe('GST');
    expect(resolvePurchaseTaxType('27ABCDE1234F1Z5', '')).toBe('GST');
  });
});
