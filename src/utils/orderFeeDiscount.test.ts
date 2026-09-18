import { describe, expect, it } from "vitest";
import { getDeliveryFeeLine, getDiscountAmountLine } from "./orderFeeDiscount";

describe("getDeliveryFeeLine", () => {
    it("returns a compact fee line when BE sent a numeric delivery_fee ≠ 0", () => {
        expect(getDeliveryFeeLine({ delivery_fee: 40 })).toBe("Fee ₹40");
        expect(getDeliveryFeeLine({ delivery_fee: 40.5 })).toBe("Fee ₹40.5");
        expect(getDeliveryFeeLine({ delivery_fee: "25" })).toBe("Fee ₹25");
        expect(getDeliveryFeeLine({ delivery_fee: "  12.75  " })).toBe("Fee ₹12.75");
    });

    it("returns null when delivery_fee is missing, null, blank, or 0", () => {
        expect(getDeliveryFeeLine({})).toBeNull();
        expect(getDeliveryFeeLine({ delivery_fee: undefined })).toBeNull();
        expect(getDeliveryFeeLine({ delivery_fee: null })).toBeNull();
        expect(getDeliveryFeeLine({ delivery_fee: "" })).toBeNull();
        expect(getDeliveryFeeLine({ delivery_fee: "   " })).toBeNull();
        expect(getDeliveryFeeLine({ delivery_fee: 0 })).toBeNull();
        expect(getDeliveryFeeLine({ delivery_fee: "0" })).toBeNull();
        expect(getDeliveryFeeLine({ delivery_fee: "0.00" })).toBeNull();
    });

    it("returns null for non-numeric present values", () => {
        expect(getDeliveryFeeLine({ delivery_fee: "n/a" })).toBeNull();
    });

    it("does not invent delivery_fee from total_amount or discount_amount", () => {
        expect(getDeliveryFeeLine({ total_amount: 500, discount_amount: 20 })).toBeNull();
    });
});

describe("getDiscountAmountLine", () => {
    it("returns a compact discount line when BE sent a numeric discount_amount ≠ 0", () => {
        expect(getDiscountAmountLine({ discount_amount: 15 })).toBe("Disc ₹15");
        expect(getDiscountAmountLine({ discount_amount: 10.25 })).toBe("Disc ₹10.25");
        expect(getDiscountAmountLine({ discount_amount: "8" })).toBe("Disc ₹8");
    });

    it("returns null when discount_amount is missing, null, blank, or 0", () => {
        expect(getDiscountAmountLine({})).toBeNull();
        expect(getDiscountAmountLine({ discount_amount: undefined })).toBeNull();
        expect(getDiscountAmountLine({ discount_amount: null })).toBeNull();
        expect(getDiscountAmountLine({ discount_amount: "" })).toBeNull();
        expect(getDiscountAmountLine({ discount_amount: 0 })).toBeNull();
        expect(getDiscountAmountLine({ discount_amount: "0.00" })).toBeNull();
    });

    it("returns null for non-numeric present values", () => {
        expect(getDiscountAmountLine({ discount_amount: "n/a" })).toBeNull();
    });

    it("does not invent discount_amount from total_amount or delivery_fee", () => {
        expect(getDiscountAmountLine({ total_amount: 500, delivery_fee: 40 })).toBeNull();
    });
});
