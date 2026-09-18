import { describe, expect, it } from "vitest";
import { getDisplayStockQuantity, hasSaleableQuantity } from "./saleableQuantity";

describe("hasSaleableQuantity", () => {
    it("is true when the field is present, including 0", () => {
        expect(hasSaleableQuantity({ saleable_quantity: 4, quantity: 10 })).toBe(true);
        expect(hasSaleableQuantity({ saleable_quantity: 0, quantity: 10 })).toBe(true);
        expect(hasSaleableQuantity({ saleable_quantity: "0", quantity: 10 })).toBe(true);
    });

    it("is false when the field is absent, undefined, or null", () => {
        expect(hasSaleableQuantity({ quantity: 10 })).toBe(false);
        expect(hasSaleableQuantity({ saleable_quantity: undefined, quantity: 10 })).toBe(false);
        expect(hasSaleableQuantity({ saleable_quantity: null, quantity: 10 })).toBe(false);
        expect(hasSaleableQuantity({ saleable_quantity: "", quantity: 10 })).toBe(false);
    });
});

describe("getDisplayStockQuantity", () => {
    it("uses saleable_quantity when present even if it differs from quantity", () => {
        expect(getDisplayStockQuantity({ saleable_quantity: 3, quantity: 12 })).toBe(3);
    });

    it("uses saleable_quantity of 0 (OOS) instead of falling back to quantity", () => {
        expect(getDisplayStockQuantity({ saleable_quantity: 0, quantity: 12 })).toBe(0);
    });

    it("falls back to quantity when saleable_quantity is absent", () => {
        expect(getDisplayStockQuantity({ quantity: 8 })).toBe(8);
        expect(getDisplayStockQuantity({ saleable_quantity: undefined, quantity: 8 })).toBe(8);
        expect(getDisplayStockQuantity({ saleable_quantity: null, quantity: 8 })).toBe(8);
    });

    it("does not invent a saleable value when both fields are missing", () => {
        expect(getDisplayStockQuantity({})).toBe(0);
    });
});
