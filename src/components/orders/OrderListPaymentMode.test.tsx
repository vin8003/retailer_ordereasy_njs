import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderListPaymentMode } from "./OrderListPaymentMode";

describe("OrderListPaymentMode", () => {
    it("shows muted payment mode when BE sent payment_mode", () => {
        const markup = renderToStaticMarkup(
            <OrderListPaymentMode order={{ payment_mode: "upi" }} />
        );
        expect(markup).toContain("Mode: upi");
        expect(markup).toContain("Payment mode upi");
    });

    it("trims whitespace before showing the BE value", () => {
        const markup = renderToStaticMarkup(
            <OrderListPaymentMode order={{ payment_mode: "  cash  " }} />
        );
        expect(markup).toContain("Mode: cash");
        expect(markup).not.toContain("  cash  ");
    });

    it("renders nothing when payment_mode is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OrderListPaymentMode order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OrderListPaymentMode order={{ payment_mode: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OrderListPaymentMode order={{ payment_mode: "   " }} />)
        ).toBe("");
    });

    it("does not invent payment_mode from payment_status or source", () => {
        const markup = renderToStaticMarkup(
            <OrderListPaymentMode
                order={{ payment_status: "paid", source: "pos" }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("COD");
        expect(markup).not.toContain("Mode:");
    });
});
