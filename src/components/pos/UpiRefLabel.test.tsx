import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpiRefLabel } from "./UpiRefLabel";

describe("UpiRefLabel", () => {
    it("shows the UPI ref when BE sent upi_ref", () => {
        const markup = renderToStaticMarkup(
            <UpiRefLabel payment={{ upi_ref: "AXIS123456789012" }} />
        );
        expect(markup).toContain("UPI REF: AXIS123456789012");
        expect(markup).toContain("UPI ref AXIS123456789012");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<UpiRefLabel payment={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<UpiRefLabel payment={{ upi_ref: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<UpiRefLabel payment={{ upi_ref: "  " }} />)
        ).toBe("");
    });

    it("does not invent a label from payment_reference_id or order_number", () => {
        const markup = renderToStaticMarkup(
            <UpiRefLabel
                payment={{
                    payment_reference_id: "HIDDENUTR0001",
                    order_number: "OE-POS101",
                    payment_mode: "upi",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
