import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierListScalars } from "./SupplierListScalars";

describe("SupplierListScalars", () => {
    it("shows muted GSTIN and payment terms when BE sent the scalars", () => {
        const markup = renderToStaticMarkup(
            <SupplierListScalars
                supplier={{
                    gst_number: "27AAPFU0939F1ZV",
                    payment_terms: "Net 30",
                }}
            />
        );
        expect(markup).toContain("GSTIN 27AAPFU0939F1ZV");
        expect(markup).toContain("Terms Net 30");
        expect(markup).toContain("Payment terms Net 30");
    });

    it("shows only the scalars BE actually sent", () => {
        const gstOnly = renderToStaticMarkup(
            <SupplierListScalars supplier={{ gst_number: "22AAAAA0000A1Z5" }} />
        );
        expect(gstOnly).toContain("GSTIN 22AAAAA0000A1Z5");
        expect(gstOnly).not.toContain("Terms");

        const termsOnly = renderToStaticMarkup(
            <SupplierListScalars supplier={{ payment_terms: "COD" }} />
        );
        expect(termsOnly).toContain("Terms COD");
        expect(termsOnly).not.toContain("GSTIN");
    });

    it("renders nothing when gst_number/payment_terms are omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierListScalars supplier={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <SupplierListScalars supplier={{ gst_number: null, payment_terms: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <SupplierListScalars supplier={{ gst_number: "  ", payment_terms: "   " }} />
            )
        ).toBe("");
    });

    it("does not invent GSTIN or payment terms from company name", () => {
        const markup = renderToStaticMarkup(
            <SupplierListScalars supplier={{ company_name: "ABC Foods" }} />
        );
        expect(markup).toBe("");
    });
});
