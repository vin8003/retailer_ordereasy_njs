import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseInvoiceDate } from "./PurchaseInvoiceDate";

const formatInvoiceDate = (raw: string) =>
    new Date(raw).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

describe("PurchaseInvoiceDate", () => {
    it("shows muted invoice_date text when BE sent a valid date", () => {
        const formatted = formatInvoiceDate("2026-09-18");
        const markup = renderToStaticMarkup(
            <PurchaseInvoiceDate invoice={{ invoice_date: "2026-09-18" }} />
        );
        expect(markup).toContain(formatted);
        expect(markup).toContain(`Invoice date ${formatted}`);
    });

    it("renders nothing when invoice_date is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseInvoiceDate invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseInvoiceDate invoice={{ invoice_date: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseInvoiceDate invoice={{ invoice_date: "  " }} />)
        ).toBe("");
    });

    it("does not invent invoice_date from created_at, return_date, or invoice_number", () => {
        const markup = renderToStaticMarkup(
            <PurchaseInvoiceDate
                invoice={{
                    created_at: "2026-09-01T08:00:00.000Z",
                    return_date: "2026-09-02",
                    invoice_number: "INV-44",
                }}
            />
        );
        expect(markup).toBe("");
        expect(markup).not.toContain("INV-44");
    });

    it("renders nothing for invalid invoice_date values", () => {
        expect(
            renderToStaticMarkup(<PurchaseInvoiceDate invoice={{ invoice_date: "n/a" }} />)
        ).toBe("");
    });
});
