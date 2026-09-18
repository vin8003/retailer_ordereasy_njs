import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierDetailContact } from "./SupplierDetailContact";

describe("SupplierDetailContact", () => {
    it("shows phone and email when BE sent non-empty values", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailContact
                supplier={{
                    phone_number: "9876543210",
                    email: "vendor@example.com",
                }}
            />
        );
        expect(markup).toContain("9876543210");
        expect(markup).toContain("Phone 9876543210");
        expect(markup).toContain("vendor@example.com");
        expect(markup).toContain("Email vendor@example.com");
    });

    it("shows only the scalars BE actually sent", () => {
        const phoneOnly = renderToStaticMarkup(
            <SupplierDetailContact supplier={{ phone_number: "022-1234" }} />
        );
        expect(phoneOnly).toContain("022-1234");
        expect(phoneOnly).not.toContain("@");

        const emailOnly = renderToStaticMarkup(
            <SupplierDetailContact supplier={{ email: "only@example.com" }} />
        );
        expect(emailOnly).toContain("only@example.com");
        expect(emailOnly).not.toContain("Phone");
    });

    it("renders nothing when email/phone are omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierDetailContact supplier={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <SupplierDetailContact supplier={{ email: null, phone_number: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <SupplierDetailContact supplier={{ email: "  ", phone_number: "   " }} />
            )
        ).toBe("");
    });

    it("does not invent contact lines from name, gst_number, or payment_terms", () => {
        const markup = renderToStaticMarkup(
            <SupplierDetailContact
                supplier={{
                    company_name: "Acme Distributors",
                    contact_person: "Ravi",
                    gst_number: "27AAPFU0939F1ZV",
                    payment_terms: "Net 15",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("27AAPFU0939F1ZV");
        expect(markup).not.toContain("Net 15");
    });
});
