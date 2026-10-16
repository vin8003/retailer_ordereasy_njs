import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseListSupplierName } from "./PurchaseListSupplierName";

describe("PurchaseListSupplierName", () => {
    it("shows the supplier name when BE sent a non-empty supplier_name", () => {
        const markup = renderToStaticMarkup(
            <PurchaseListSupplierName invoice={{ supplier_name: "ABC Foods" }} />
        );
        expect(markup).toContain("ABC Foods");
        expect(markup).toContain("Supplier ABC Foods");
    });

    it("renders nothing when supplier_name is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseListSupplierName invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseListSupplierName invoice={{ supplier_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseListSupplierName invoice={{ supplier_name: "   " }} />)
        ).toBe("");
    });

    it("does not invent supplier_name from notes, invoice_number, or distributor_name", () => {
        const markup = renderToStaticMarkup(
            <PurchaseListSupplierName
                invoice={{
                    invoice_number: "INV-44",
                    notes: "Paid at shop",
                    distributor_name: "ABC Foods",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
