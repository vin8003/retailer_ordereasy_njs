import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderRoundOffRow } from "./OrderRoundOffRow";

describe("OrderRoundOffRow", () => {
    it("shows a Round Off totals row when BE sent round_off", () => {
        const markup = renderToStaticMarkup(
            <OrderRoundOffRow order={{ round_off: 0.36 }} />
        );
        expect(markup).toContain("Round Off");
        expect(markup).toContain("₹0.36");
    });

    it("shows a present zero and a negative adjustment", () => {
        expect(renderToStaticMarkup(<OrderRoundOffRow order={{ round_off: 0 }} />)).toContain(
            "₹0.00"
        );
        expect(
            renderToStaticMarkup(<OrderRoundOffRow order={{ round_off: -0.25 }} />)
        ).toContain("₹-0.25");
    });

    it("renders nothing when round_off is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderRoundOffRow order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderRoundOffRow order={{ round_off: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderRoundOffRow order={{ round_off: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderRoundOffRow order={{ round_off: "   " }} />)
        ).toBe("");
    });

    it("does not invent a row from totals, delivery_fee, or discount_amount", () => {
        const markup = renderToStaticMarkup(
            <OrderRoundOffRow
                order={{
                    subtotal: 99.64,
                    delivery_fee: 20,
                    discount_amount: 0.4,
                    total_amount: 119.24,
                    rounding: 0.36,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
