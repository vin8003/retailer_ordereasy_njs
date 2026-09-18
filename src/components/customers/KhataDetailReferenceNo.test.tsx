import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KhataDetailReferenceNo } from "./KhataDetailReferenceNo";

describe("KhataDetailReferenceNo", () => {
    it("shows muted reference text when BE sent reference_no", () => {
        const markup = renderToStaticMarkup(
            <KhataDetailReferenceNo entry={{ reference_no: "UTR-9911" }} />
        );
        expect(markup).toContain("Ref UTR-9911");
        expect(markup).toContain("Reference UTR-9911");
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<KhataDetailReferenceNo entry={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<KhataDetailReferenceNo entry={{ reference_no: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<KhataDetailReferenceNo entry={{ reference_no: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<KhataDetailReferenceNo entry={{ reference_no: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from notes, order, payment, or description", () => {
        const markup = renderToStaticMarkup(
            <KhataDetailReferenceNo
                entry={{
                    id: 99,
                    notes: "Paid at shop",
                    order_number: "OE-101",
                    payment_mode: "UPI",
                    payment_reference_id: "pay_abc",
                    description: "Khata settlement",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
