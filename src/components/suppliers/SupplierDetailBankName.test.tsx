import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierDetailBankName } from "./SupplierDetailBankName";

describe("SupplierDetailBankName", () => {
    it("shows bank name when BE sent a non-empty bank_name", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailBankName supplier={{ bank_name: "HDFC Bank" }} />
        );
        expect(markup).toContain("HDFC Bank");
        expect(markup).toContain("Bank HDFC Bank");
        expect(markup).toContain("Bank Name");
    });

    it("renders nothing when bank_name is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierDetailBankName supplier={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailBankName supplier={{ bank_name: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailBankName supplier={{ bank_name: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierDetailBankName supplier={{ bank_name: "   " }} />)
        ).toBe("");
    });

    it("does not invent a bank line from name, gst_number, payment_terms, or nested bank", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailBankName
                supplier={{
                    company_name: "Acme Distributors",
                    contact_person: "Ravi",
                    gst_number: "27AAPFU0939F1ZV",
                    payment_terms: "Net 15",
                    bank: { name: "SBI" },
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("27AAPFU0939F1ZV");
        expect(markup).not.toContain("Net 15");
        expect(markup).not.toContain("SBI");
    });
});
