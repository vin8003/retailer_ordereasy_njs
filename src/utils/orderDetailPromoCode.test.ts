import { describe, expect, it } from "vitest";
import { getOrderDetailPromoCode } from "./orderDetailPromoCode";

describe("getOrderDetailPromoCode", () => {
    it("returns the trimmed promo_code when BE sent a non-empty string", () => {
        expect(getOrderDetailPromoCode({ promo_code: "SAVE20" })).toBe("SAVE20");
        expect(getOrderDetailPromoCode({ promo_code: "  FESTIVE10  " })).toBe("FESTIVE10");
    });

    it("returns null when promo_code is omitted, null, or blank", () => {
        expect(getOrderDetailPromoCode({})).toBeNull();
        expect(getOrderDetailPromoCode({ promo_code: undefined })).toBeNull();
        expect(getOrderDetailPromoCode({ promo_code: null })).toBeNull();
        expect(getOrderDetailPromoCode({ promo_code: "" })).toBeNull();
        expect(getOrderDetailPromoCode({ promo_code: "   " })).toBeNull();
    });

    it("does not invent promo_code from coupon, offers, notes, or phone", () => {
        expect(
            getOrderDetailPromoCode({
                coupon: "HIDDEN",
                coupon_code: "COUPON99",
                discount_code: "DISC",
                applied_offers: [{ name: "Weekend offer" }],
                notes: "internal remark",
                customer_phone: "9999999999",
                promo: { code: "NESTED" },
                promo_code: null,
            })
        ).toBeNull();
    });
});
