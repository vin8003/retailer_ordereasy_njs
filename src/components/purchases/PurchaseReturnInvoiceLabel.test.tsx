import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseReturnInvoiceLabel } from "./PurchaseReturnInvoiceLabel";

describe("PurchaseReturnInvoiceLabel", () => {
    it("shows Against {invoice_number} when BE sent invoice_number", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnInvoiceLabel purchaseReturn={{ invoice_number: "INV-44" }} />
        );
        expect(markup).toContain("Against INV-44");
    });

    it("renders nothing when invoice_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseReturnInvoiceLabel purchaseReturn={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseReturnInvoiceLabel purchaseReturn={{ invoice_number: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseReturnInvoiceLabel purchaseReturn={{ invoice_number: "  " }} />
            )
        ).toBe("");
    });

    it("does not invent invoice_number from return_number, supplier_name, or id", () => {
        const markup = renderToStaticMarkup(
            <PurchaseReturnInvoiceLabel
                purchaseReturn={{
                    return_number: "RET-9",
                    supplier_name: "ABC Foods",
                    id: 9,
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("Against");
        expect(markup).not.toContain("RET-9");
    });
});
