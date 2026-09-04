import { describe, expect, it } from "vitest";
import { isValidEan13, resolveBarcodeFormat } from "./barcode";

describe("barcode format", () => {
  it("accepts 13-digit EAN-13 with a valid checksum", () => {
    expect(isValidEan13("8901234567890")).toBe(true);
  });

  it("accepts 12-digit values so JsBarcode can add the check digit", () => {
    expect(isValidEan13("890123456789")).toBe(true);
  });

  it("rejects non-numeric or wrong-length codes", () => {
    expect(isValidEan13("ABC-123")).toBe(false);
    expect(isValidEan13("12345")).toBe(false);
    expect(isValidEan13("")).toBe(false);
  });

  it("falls back to CODE128 when EAN-13 is requested but the value is invalid", () => {
    expect(resolveBarcodeFormat("SKU-44", "EAN13")).toBe("CODE128");
    expect(resolveBarcodeFormat("8901234567890", "EAN13")).toBe("EAN13");
    expect(resolveBarcodeFormat("8901234567890", "CODE128")).toBe("CODE128");
  });
});
