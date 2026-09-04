import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_FIELDS, LABEL_SIZES, getLabelSize, pageSizeMm } from "./templates";

describe("label templates", () => {
  it("includes the standard 50x25 and 38x25 sticker sizes", () => {
    expect(LABEL_SIZES.map((s) => s.id)).toEqual(["50x25", "38x25"]);
    expect(getLabelSize("50x25")).toEqual({
      id: "50x25",
      label: "50mm × 25mm",
      widthMm: 50,
      heightMm: 25,
    });
    expect(getLabelSize("38x25").widthMm).toBe(38);
  });

  it("computes @page size as label width times column count", () => {
    expect(pageSizeMm("50x25", 1)).toEqual({ widthMm: 50, heightMm: 25 });
    expect(pageSizeMm("38x25", 2)).toEqual({ widthMm: 76, heightMm: 25 });
    expect(pageSizeMm("50x25", 3)).toEqual({ widthMm: 150, heightMm: 25 });
  });

  it("enables shop, name, prices, and barcode by default", () => {
    expect(DEFAULT_LABEL_FIELDS).toMatchObject({
      shopName: true,
      productName: true,
      mrp: true,
      sellingPrice: true,
      barcode: true,
    });
  });
});
