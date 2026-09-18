import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierDetailFssai } from "./SupplierDetailFssai";

describe("SupplierDetailFssai", () => {
    it("shows FSSAI when BE sent a non-empty fssai_number", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailFssai supplier={{ fssai_number: "10012022000012" }} />
        );
        expect(markup).toContain("10012022000012");
        expect(markup).toContain("FSSAI 10012022000012");
        expect(markup).toContain("FSSAI Number");
    });

    it("renders nothing when fssai_number is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierDetailFssai supplier={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailFssai supplier={{ fssai_number: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailFssai supplier={{ fssai_number: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailFssai supplier={{ fssai_number: "   " }} />)
        ).toBe("");
    });

    it("does not invent an FSSAI line from name, gst_number, payment_terms, or aliases", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailFssai
                supplier={{
                    company_name: "Acme Distributors",
                    contact_person: "Ravi",
                    gst_number: "27AAPFU0939F1ZV",
                    payment_terms: "Net 15",
                    fssai_no: "10012022000099",
                    license_number: "LIC-1",
                    fssai: { number: "10012022000088" },
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("27AAPFU0939F1ZV");
        expect(markup).not.toContain("Net 15");
        expect(markup).not.toContain("10012022000099");
        expect(markup).not.toContain("10012022000088");
        expect(markup).not.toContain("LIC-1");
    });
});
