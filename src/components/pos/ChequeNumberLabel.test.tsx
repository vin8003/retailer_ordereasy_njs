import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChequeNumberLabel } from "./ChequeNumberLabel";

describe("ChequeNumberLabel", () => {
    it("shows the cheque number when BE sent cheque_number", () => {
        const markup = renderToStaticMarkup(
            <ChequeNumberLabel payment={{ cheque_number: "CHQ-90210" }} />
        );
        expect(markup).toContain("CHEQUE NO: CHQ-90210");
        expect(markup).toContain("Cheque number CHQ-90210");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<ChequeNumberLabel payment={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<ChequeNumberLabel payment={{ cheque_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<ChequeNumberLabel payment={{ cheque_number: "  " }} />)
        ).toBe("");
    });

    it("does not invent a label from cheque aliases, payment_reference_id, or notes", () => {
        const markup = renderToStaticMarkup(
            <ChequeNumberLabel
                payment={{
                    cheque: { number: "NESTED-99" },
                    cheque_no: "ALIAS-88",
                    check_number: "US-SPELLING",
                    payment_reference_id: "HIDDENREF0001",
                    order_number: "OE-POS101",
                    payment_mode: "cheque",
                    notes: "Cheque CHQ-90210",
                }}
            />
        );
        expect(markup).toBe("");
    });

    it("shows only top-level cheque_number when aliases are also present", () => {
        const markup = renderToStaticMarkup(
            <ChequeNumberLabel
                payment={{
                    cheque_number: "CHQ-90210",
                    cheque: { number: "NESTED-99" },
                    cheque_no: "ALIAS-88",
                    check_number: "US-SPELLING",
                    payment_reference_id: "HIDDENREF0001",
                    notes: "Cheque ALIAS-88",
                }}
            />
        );
        expect(markup).toContain("CHEQUE NO: CHQ-90210");
        expect(markup).not.toContain("NESTED-99");
        expect(markup).not.toContain("ALIAS-88");
        expect(markup).not.toContain("US-SPELLING");
        expect(markup).not.toContain("HIDDENREF0001");
    });
});
