import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaymentModeLabel } from "./PaymentModeLabel";

describe("PaymentModeLabel", () => {
    it("shows the payload payment_mode on the payment block when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <PaymentModeLabel order={{ payment_mode: "upi" }} />
        );
        expect(markup).toContain("upi");
        expect(markup).toContain("Payment mode upi");
        expect(markup).toContain("Method:");
    });

    it("trims whitespace and still shows the payload value", () => {
        const markup = renderToStaticMarkup(
            <PaymentModeLabel order={{ payment_mode: "  cash  " }} />
        );
        expect(markup).toContain("cash");
        expect(markup).not.toContain("  cash  ");
    });

    it("renders nothing when payment_mode is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PaymentModeLabel order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PaymentModeLabel order={{ payment_mode: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PaymentModeLabel order={{ payment_mode: "  " }} />)
        ).toBe("");
    });

    it("does not invent a mode from payment_status or payment_method", () => {
        const markup = renderToStaticMarkup(
            <PaymentModeLabel
                order={{
                    payment_status: "paid",
                    payment_method: "upi",
                    payment_reference_id: "123456789012",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
