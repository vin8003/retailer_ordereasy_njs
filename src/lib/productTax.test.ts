import { describe, expect, it } from "vitest";
import {
  GST_RATE_OPTIONS,
  buildBulkTaxChanges,
  shouldRecommendHsn,
} from "./productTax";

describe("product tax helpers", () => {
  it("exposes only the supported GST rates", () => {
    expect(GST_RATE_OPTIONS).toEqual([0, 3, 5, 18, 40]);
  });

  it("recommends an HSN code only for taxable products without one", () => {
    expect(shouldRecommendHsn(18, "")).toBe(true);
    expect(shouldRecommendHsn("5.00", "   ")).toBe(true);
    expect(shouldRecommendHsn(0, "")).toBe(false);
    expect(shouldRecommendHsn(18, "21069099")).toBe(false);
  });

  it("builds changes for every selected product using only supplied fields", () => {
    expect(buildBulkTaxChanges([4, 9], { gstRate: 5 })).toEqual([
      { id: 4, gst_rate: 5 },
      { id: 9, gst_rate: 5 },
    ]);

    expect(buildBulkTaxChanges([4], { hsnCode: "21069099", gstRate: 18 })).toEqual([
      { id: 4, hsn_code: "21069099", gst_rate: 18 },
    ]);
  });
});
