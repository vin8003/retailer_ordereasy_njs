import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierListEmail } from "./SupplierListEmail";

describe("SupplierListEmail", () => {
    it("shows muted email when BE sent a non-empty value", () => {
        const markup = renderToStaticMarkup(
            <SupplierListEmail supplier={{ email: "shop@example.com" }} />
        );
        expect(markup).toContain("shop@example.com");
        expect(markup).toContain("Email shop@example.com");
    });

    it("renders nothing when email is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierListEmail supplier={{}} />)).toBe("");
        expect(renderToStaticMarkup(<SupplierListEmail supplier={{ email: null }} />)).toBe("");
        expect(renderToStaticMarkup(<SupplierListEmail supplier={{ email: "  " }} />)).toBe("");
    });

    it("does not invent email from company name, contact, or phone", () => {
        const markup = renderToStaticMarkup(
            <SupplierListEmail
                supplier={{
                    company_name: "Acme Distributors",
                    contact_person: "Ravi",
                    phone_number: "9999999999",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
