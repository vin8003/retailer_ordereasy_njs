import { describe, expect, it } from "vitest";
import { getOutOfStockLabel, getUnavailableLabel } from "./availabilityFlags";

describe("getUnavailableLabel", () => {
    it("returns Unavailable only when BE sent is_available false", () => {
        expect(getUnavailableLabel({ is_available: false })).toBe("Unavailable");
    });

    it("returns null when is_available is true, absent, or null", () => {
        expect(getUnavailableLabel({})).toBeNull();
        expect(getUnavailableLabel({ is_available: undefined })).toBeNull();
        expect(getUnavailableLabel({ is_available: null })).toBeNull();
        expect(getUnavailableLabel({ is_available: true })).toBeNull();
    });

    it("does not invent Unavailable from is_in_stock", () => {
        expect(getUnavailableLabel({ is_in_stock: false })).toBeNull();
    });
});

describe("getOutOfStockLabel", () => {
    it("returns Out of stock only when BE sent is_in_stock false", () => {
        expect(getOutOfStockLabel({ is_in_stock: false })).toBe("Out of stock");
    });

    it("returns null when is_in_stock is true, absent, or null", () => {
        expect(getOutOfStockLabel({})).toBeNull();
        expect(getOutOfStockLabel({ is_in_stock: undefined })).toBeNull();
        expect(getOutOfStockLabel({ is_in_stock: null })).toBeNull();
        expect(getOutOfStockLabel({ is_in_stock: true })).toBeNull();
    });

    it("does not invent Out of stock from is_available", () => {
        expect(getOutOfStockLabel({ is_available: false })).toBeNull();
    });

    it("follows saleable_quantity when BE sent it, so badge and number agree", () => {
        expect(getOutOfStockLabel({ is_in_stock: true, saleable_quantity: 0 })).toBe("Out of stock");
        expect(getOutOfStockLabel({ is_in_stock: false, saleable_quantity: "2.5" })).toBeNull();
    });

    it("ignores saleable_quantity for untracked SKUs", () => {
        expect(
            getOutOfStockLabel({ track_inventory: false, saleable_quantity: 0, is_in_stock: true })
        ).toBeNull();
    });
});
