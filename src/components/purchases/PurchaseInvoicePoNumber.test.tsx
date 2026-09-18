import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseInvoicePoNumber } from "./PurchaseInvoicePoNumber";

describe("PurchaseInvoicePoNumber", () => {
    it("shows muted PO text when BE sent po_number", () => {
        const markup = renderToStaticMarkup(
            <PurchaseInvoicePoNumber invoice={{ po_number: "4412" }} />
        );
        expect(markup).toContain("PO 4412");
        expect(markup).toContain("4412");
    });

    it("shows po_number on table and card class variants when BE sent it", () => {
        const table = renderToStaticMarkup(
            <div className="hidden md:block">
                <PurchaseInvoicePoNumber invoice={{ po_number: 4412 }} className="mt-0.5 font-normal" />
            </div>
        );
        const card = renderToStaticMarkup(
            <div className="block md:hidden">
                <PurchaseInvoicePoNumber
                    invoice={{ po_number: 4412 }}
                    className="text-[10px] mt-0.5 font-normal normal-case tracking-normal"
                />
            </div>
        );
        expect(table).toContain("hidden md:block");
        expect(table).toContain("PO 4412");
        expect(card).toContain("block md:hidden");
        expect(card).toContain("PO 4412");
    });

    it("renders nothing when po_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseInvoicePoNumber invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseInvoicePoNumber invoice={{ po_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseInvoicePoNumber invoice={{ po_number: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseInvoicePoNumber invoice={{ po_number: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from invoice_number, notes, payment_status, or supplier_name", () => {
        const markup = renderToStaticMarkup(
            <PurchaseInvoicePoNumber
                invoice={{
                    invoice_number: "INV-44",
                    notes: "Paid at shop",
                    payment_status: "PAID",
                    supplier_name: "ABC Foods",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
