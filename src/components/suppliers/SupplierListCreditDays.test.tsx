import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupplierListCreditDays } from "./SupplierListCreditDays";

describe("SupplierListCreditDays", () => {
    it("shows muted credit days when BE sent credit_days", () => {
        const markup = renderToStaticMarkup(
            <SupplierListCreditDays supplier={{ credit_days: 15 }} />
        );
        expect(markup).toContain("15 days");
        expect(markup).toContain("Credit 15 days");
    });

    it("shows credit_days of 0 and singular 1 day when BE sent them", () => {
        expect(renderToStaticMarkup(<SupplierListCreditDays supplier={{ credit_days: 0 }} />)).toContain(
            "0 days"
        );
        expect(renderToStaticMarkup(<SupplierListCreditDays supplier={{ credit_days: 1 }} />)).toContain(
            "1 day"
        );
    });

    it("renders nothing when credit_days is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<SupplierListCreditDays supplier={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<SupplierListCreditDays supplier={{ credit_days: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierListCreditDays supplier={{ credit_days: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<SupplierListCreditDays supplier={{ credit_days: "   " }} />)
        ).toBe("");
    });

    it("does not invent credit_days from email, payment_terms, gst, or balance", () => {
        const markup = renderToStaticMarkup(
            <SupplierListCreditDays
                supplier={{
                    email: "buyer@example.com",
                    payment_terms: "Net 30",
                    gst_number: "27AAAAA0000A1Z5",
                    balance_due: 2500,
                    credit_due_days: 15,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
