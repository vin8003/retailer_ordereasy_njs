import { describe, expect, it } from "vitest";
import { getBarcodeLabel, getBrandNameLabel } from "./productIdentity";

describe("getBrandNameLabel", () => {
    it("returns the trimmed brand_name when BE sent a non-empty string", () => {
        expect(getBrandNameLabel({ brand_name: "Amul" })).toBe("Amul");
        expect(getBrandNameLabel({ brand_name: "  Nestle  " })).toBe("Nestle");
    });

    it("returns null when brand_name is omitted, null, or blank", () => {
        expect(getBrandNameLabel({})).toBeNull();
        expect(getBrandNameLabel({ brand_name: undefined })).toBeNull();
        expect(getBrandNameLabel({ brand_name: null })).toBeNull();
        expect(getBrandNameLabel({ brand_name: "" })).toBeNull();
        expect(getBrandNameLabel({ brand_name: "   " })).toBeNull();
    });

    it("does not invent brand_name from a nested brand object", () => {
        expect(getBrandNameLabel({ brand: { name: "Hidden Brand" } })).toBeNull();
        expect(
            getBrandNameLabel({ brand: { name: "Hidden Brand" }, brand_name: null })
        ).toBeNull();
    });
});

describe("getBarcodeLabel", () => {
    it("returns the trimmed barcode when BE sent a non-empty string", () => {
        expect(getBarcodeLabel({ barcode: "8901234567890" })).toBe("8901234567890");
        expect(getBarcodeLabel({ barcode: "  ABC-99  " })).toBe("ABC-99");
    });

    it("returns null when barcode is omitted, null, or blank", () => {
        expect(getBarcodeLabel({})).toBeNull();
        expect(getBarcodeLabel({ barcode: undefined })).toBeNull();
        expect(getBarcodeLabel({ barcode: null })).toBeNull();
        expect(getBarcodeLabel({ barcode: "" })).toBeNull();
        expect(getBarcodeLabel({ barcode: "   " })).toBeNull();
    });
});
