import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseReturnLrNumber } from "./PurchaseReturnLrNumber";

describe("PurchaseReturnLrNumber", () => {
    it("shows muted LR text when BE sent lr_number", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnLrNumber row={{ lr_number: "LR-DUMMY-1001" }} />
        );
        expect(markup).toContain("LR-DUMMY-1001");
        expect(markup).toContain("LR LR-DUMMY-1001");
    });

    it("renders nothing when lr_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseReturnLrNumber row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseReturnLrNumber row={{ lr_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseReturnLrNumber row={{ lr_number: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseReturnLrNumber row={{ lr_number: "   " }} />)
        ).toBe("");
    });

    it("does not invent lr_number from return_number, invoice_number, notes, or id", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnLrNumber
                row={{
                    id: 77,
                    return_number: "RET-77",
                    invoice_number: "INV-44",
                    supplier_name: "Dummy Distributors",
                    notes: "send via transporter",
                    tracking_number: "TRK-9",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
