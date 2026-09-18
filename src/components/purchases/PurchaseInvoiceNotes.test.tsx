import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseInvoiceNotes } from "./PurchaseInvoiceNotes";

describe("PurchaseInvoiceNotes", () => {
    it("shows muted notes text when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <PurchaseInvoiceNotes invoice={{ notes: "Paid at shop" }} />
        );
        expect(markup).toContain("Paid at shop");
        expect(markup).toContain("Notes Paid at shop");
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseInvoiceNotes invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseInvoiceNotes invoice={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseInvoiceNotes invoice={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from invoice_number, payment_status, or supplier_name", () => {
        const markup = renderToStaticMarkup(
            <PurchaseInvoiceNotes
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
