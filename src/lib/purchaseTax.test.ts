import { describe, expect, it } from 'vitest';

import {
  calculatePurchaseTax,
  purchaseTaxSnapshot,
  resolvePurchaseTaxType,
} from './purchaseTax';

describe('calculatePurchaseTax', () => {
  it('splits GST-inclusive purchase rows and rounds the grand total to rupees', () => {
    expect(calculatePurchaseTax([
      { total: 118.4, gstRate: 18 },
      { total: 50, gstRate: 0 },
    ])).toEqual({
      taxableAmount: 150.34,
      taxAmount: 18.06,
      grandTotal: 168,
      roundOff: -0.4,
    });
  });

  it('reports a zero round off when the inclusive total is already whole rupees', () => {
    expect(calculatePurchaseTax([{ total: 118, gstRate: 18 }])).toEqual({
      taxableAmount: 100,
      taxAmount: 18,
      grandTotal: 118,
      roundOff: 0,
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

describe('purchaseTaxSnapshot', () => {
  it('normalizes persisted invoice tax fields for historical edit rows', () => {
    expect(purchaseTaxSnapshot({
      gst_rate: '5.00',
      hsn_code: '09011111',
    })).toEqual({
      gstRate: 5,
      hsnCode: '09011111',
    });
  });
});
