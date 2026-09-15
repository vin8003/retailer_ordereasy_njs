import { describe, expect, it } from 'vitest';

import { calculateInclusiveReturnTax } from './returnTax';

describe('calculateInclusiveReturnTax', () => {
  it('splits selected return lines while preserving the inclusive total', () => {
    expect(calculateInclusiveReturnTax([
      { quantity: 2, unitPrice: 118, gstRate: 18 },
      { quantity: 1, unitPrice: 105, gstRate: 5 },
    ])).toEqual({
      taxableAmount: 300,
      taxAmount: 41,
      inclusiveTotal: 341,
    });
  });
});
