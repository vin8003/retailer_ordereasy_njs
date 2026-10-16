import { describe, expect, it } from "vitest";
import { getBarcodeLabel, getBrandNameLabel, getProductGroupLabel } from "./productIdentity";

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

describe("getProductGroupLabel", () => {
    it("returns the trimmed product_group when BE sent a non-empty string", () => {
        expect(getProductGroupLabel({ product_group: "Dairy" })).toBe("Dairy");
        expect(getProductGroupLabel({ product_group: "  Snacks  " })).toBe("Snacks");
    });

    it("returns null when product_group is omitted, null, or blank", () => {
        expect(getProductGroupLabel({})).toBeNull();
        expect(getProductGroupLabel({ product_group: undefined })).toBeNull();
        expect(getProductGroupLabel({ product_group: null })).toBeNull();
        expect(getProductGroupLabel({ product_group: "" })).toBeNull();
        expect(getProductGroupLabel({ product_group: "   " })).toBeNull();
    });

    it("does not invent product_group from other fields", () => {
        expect(getProductGroupLabel({ brand_name: "Amul", barcode: "8901234567890" })).toBeNull();
    });
});
