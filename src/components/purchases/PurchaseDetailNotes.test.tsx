import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseDetailNotes } from "./PurchaseDetailNotes";

describe("PurchaseDetailNotes", () => {
    it("shows notes text when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailNotes invoice={{ notes: "Paid at shop" }} />
        );
        expect(markup).toContain("Paid at shop");
        expect(markup).toContain("Notes Paid at shop");
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseDetailNotes invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailNotes invoice={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailNotes invoice={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from invoice_number, payment_status, or supplier_name", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailNotes
                invoice={{
                    invoice_number: "INV-44",
                    payment_status: "PAID",
                    supplier_name: "ABC Foods",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
