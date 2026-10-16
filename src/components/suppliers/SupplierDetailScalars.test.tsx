import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierDetailScalars } from "./SupplierDetailScalars";

describe("SupplierDetailScalars", () => {
    it("shows GST Number and Payment Terms when BE sent the scalars", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailScalars
                supplier={{
                    gst_number: "27AAPFU0939F1ZV",
                    payment_terms: "Net 30",
                }}
            />
        );
        expect(markup).toContain("GST Number");
        expect(markup).toContain("27AAPFU0939F1ZV");
        expect(markup).toContain("GSTIN 27AAPFU0939F1ZV");
        expect(markup).toContain("Payment Terms");
        expect(markup).toContain("Net 30");
        expect(markup).toContain("Payment terms Net 30");
    });

    it("shows only the scalars BE actually sent", () => {
        const gstOnly = renderToStaticMarkup(
            <SupplierDetailScalars supplier={{ gst_number: "22AAAAA0000A1Z5" }} />
        );
        expect(gstOnly).toContain("GST Number");
        expect(gstOnly).toContain("22AAAAA0000A1Z5");
        expect(gstOnly).not.toContain("Payment Terms");

        const termsOnly = renderToStaticMarkup(
            <SupplierDetailScalars supplier={{ payment_terms: "COD" }} />
        );
        expect(termsOnly).toContain("Payment Terms");
        expect(termsOnly).toContain("COD");
        expect(termsOnly).not.toContain("GST Number");
    });

    it("renders nothing when gst_number/payment_terms are omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierDetailScalars supplier={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <SupplierDetailScalars supplier={{ gst_number: null, payment_terms: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <SupplierDetailScalars supplier={{ gst_number: "  ", payment_terms: "   " }} />
            )
        ).toBe("");
    });

    it("does not invent GSTIN or payment terms from company name", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailScalars supplier={{ company_name: "ABC Foods" }} />
        );
        expect(markup).toBe("");
    });
});
