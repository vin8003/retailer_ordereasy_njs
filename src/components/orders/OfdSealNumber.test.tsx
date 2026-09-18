import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfdSealNumber } from "./OfdSealNumber";

describe("OfdSealNumber", () => {
    it("shows muted seal text when BE sent seal_number", () => {
        const markup = renderToStaticMarkup(
            <OfdSealNumber order={{ seal_number: "SL-1001" }} />
        );
        expect(markup).toContain("Seal SL-1001");
        expect(markup).toContain("SL-1001");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<OfdSealNumber order={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<OfdSealNumber order={{ seal_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OfdSealNumber order={{ seal_number: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<OfdSealNumber order={{ seal_number: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from sibling OFD or seal-like fields", () => {
        const markup = renderToStaticMarkup(
            <OfdSealNumber
                order={{
                    seal: "NESTED",
                    seal_no: "SN-9",
                    seal_id: 77,
                    security_seal: "SEC-1",
                    vehicle_number: "MH12AB1234",
                    driver_name: "Ravi",
                    tracking_number: "TRK-1",
                    awb: "AWB-1",
                    order_number: "OE-1001",
                    status: "out_for_delivery",
                    special_instructions: "Seal the crate",
                    nested_seal: { number: "NEST-2" },
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("NESTED");
        expect(markup).not.toContain("SN-9");
        expect(markup).not.toContain("MH12AB1234");
        expect(markup).not.toContain("Ravi");
    });
});
