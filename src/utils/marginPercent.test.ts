import { describe, expect, it } from "vitest";
import { getMarginPercentLabel, hasMarginPercent } from "./marginPercent";

describe("hasMarginPercent", () => {
    it("is true when the field is present, including 0", () => {
        expect(hasMarginPercent({ margin_percent: 12.5 })).toBe(true);
        expect(hasMarginPercent({ margin_percent: 0 })).toBe(true);
        expect(hasMarginPercent({ margin_percent: "0" })).toBe(true);
    });

    it("is false when the field is absent, undefined, null, or blank", () => {
        expect(hasMarginPercent({})).toBe(false);
        expect(hasMarginPercent({ margin_percent: undefined })).toBe(false);
        expect(hasMarginPercent({ margin_percent: null })).toBe(false);
        expect(hasMarginPercent({ margin_percent: "" })).toBe(false);
        expect(hasMarginPercent({ margin_percent: "   " })).toBe(false);
    });
});

describe("getMarginPercentLabel", () => {
    it("formats a present numeric margin as compact percent text", () => {
        expect(getMarginPercentLabel({ margin_percent: 12 })).toBe("12%");
        expect(getMarginPercentLabel({ margin_percent: 12.5 })).toBe("12.5%");
        expect(getMarginPercentLabel({ margin_percent: "18.25" })).toBe("18.25%");
        expect(getMarginPercentLabel({ margin_percent: 0 })).toBe("0%");
    });

    it("returns null when the field is omitted (cashier / public)", () => {
        expect(getMarginPercentLabel({})).toBeNull();
        expect(getMarginPercentLabel({ margin_percent: undefined })).toBeNull();
        expect(getMarginPercentLabel({ margin_percent: null })).toBeNull();
    });

    it("does not invent margin from purchase_price or selling price", () => {
        const productWithCost = { purchase_price: 80, price: 100 };
        expect(getMarginPercentLabel(productWithCost)).toBeNull();
    });

    it("returns null for non-numeric present values", () => {
        expect(getMarginPercentLabel({ margin_percent: "n/a" })).toBeNull();
    });
});
