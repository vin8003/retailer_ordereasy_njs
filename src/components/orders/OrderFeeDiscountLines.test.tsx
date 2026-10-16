import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderFeeDiscountLines } from "./OrderFeeDiscountLines";

describe("OrderFeeDiscountLines", () => {
    it("shows compact muted fee and discount lines when BE sent non-zero amounts", () => {
        const markup = renderToStaticMarkup(
            <OrderFeeDiscountLines order={{ delivery_fee: 40, discount_amount: 15 }} />
        );
        expect(markup).toContain("Fee ₹40");
        expect(markup).toContain("Disc ₹15");
        expect(markup).toContain("text-muted-foreground");
    });

    it("shows only the fee line when discount is missing or 0", () => {
        const feeOnly = renderToStaticMarkup(
            <OrderFeeDiscountLines order={{ delivery_fee: 25 }} />
        );
        expect(feeOnly).toContain("Fee ₹25");
        expect(feeOnly).not.toContain("Disc");

        const zeroDiscount = renderToStaticMarkup(
            <OrderFeeDiscountLines order={{ delivery_fee: 25, discount_amount: 0 }} />
        );
        expect(zeroDiscount).toContain("Fee ₹25");
        expect(zeroDiscount).not.toContain("Disc");
    });

    it("shows only the discount line when fee is missing or 0", () => {
        const discOnly = renderToStaticMarkup(
            <OrderFeeDiscountLines order={{ discount_amount: "8" }} />
        );
        expect(discOnly).toContain("Disc ₹8");
        expect(discOnly).not.toContain("Fee");
    });

    it("renders nothing when both fields are omitted, null, or 0", () => {
        expect(renderToStaticMarkup(<OrderFeeDiscountLines order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <OrderFeeDiscountLines order={{ delivery_fee: null, discount_amount: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <OrderFeeDiscountLines order={{ delivery_fee: 0, discount_amount: "0.00" }} />
            )
        ).toBe("");
    });

    it("does not invent fee or discount from total_amount", () => {
        const markup = renderToStaticMarkup(
            <OrderFeeDiscountLines order={{ total_amount: 500 }} />
        );
        expect(markup).toBe("");
    });
});
