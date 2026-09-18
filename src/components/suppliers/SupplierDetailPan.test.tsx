import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierDetailPan } from "./SupplierDetailPan";

describe("SupplierDetailPan", () => {
    it("shows PAN Number when BE sent pan_number", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailPan supplier={{ pan_number: "ABCDE1234F" }} />
        );
        expect(markup).toContain("PAN Number");
        expect(markup).toContain("ABCDE1234F");
        expect(markup).toContain("PAN ABCDE1234F");
    });

    it("renders nothing when pan_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierDetailPan supplier={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailPan supplier={{ pan_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailPan supplier={{ pan_number: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailPan supplier={{ pan_number: "   " }} />)
        ).toBe("");
    });

    it("does not invent PAN from company name, gst_number, or payment_terms", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailPan
                supplier={{
                    company_name: "ABC Foods",
                    gst_number: "27AAPFU0939F1ZV",
                    payment_terms: "Net 30",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("27AAPFU0939F1ZV");
        expect(markup).not.toContain("Net 30");
        expect(markup).not.toContain("GST");
        expect(markup).not.toContain("Payment Terms");
    });
});
