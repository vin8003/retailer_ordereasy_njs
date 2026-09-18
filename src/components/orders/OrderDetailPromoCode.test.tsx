import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderDetailPromoCode } from "./OrderDetailPromoCode";

describe("OrderDetailPromoCode", () => {
    it("shows muted promo text when BE sent promo_code", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailPromoCode order={{ promo_code: "SAVE20" }} />
        );
        expect(markup).toContain("SAVE20");
        expect(markup).toContain("Promo SAVE20");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderDetailPromoCode order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailPromoCode order={{ promo_code: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderDetailPromoCode order={{ promo_code: "  " }} />)
        ).toBe("");
    });

    it("does not invent a label from coupon, offers, notes, or phone", () => {
        const markup = renderToStaticMarkup(
            <OrderDetailPromoCode
                order={{
                    coupon: "HIDDEN",
                    coupon_code: "COUPON99",
                    discount_code: "DISC",
                    applied_offers: [{ name: "Weekend offer" }],
                    notes: "internal remark",
                    customer_phone: "9999999999",
                    promo: { code: "NESTED" },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
