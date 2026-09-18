import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseDetailLrDate } from "./PurchaseDetailLrDate";

describe("PurchaseDetailLrDate", () => {
    it("shows muted LR date text when BE sent lr_date", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailLrDate invoice={{ lr_date: "2026-09-18" }} />
        );
        expect(markup).toContain("2026-09-18");
        expect(markup).toContain("LR Date 2026-09-18");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseDetailLrDate invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailLrDate invoice={{ lr_date: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailLrDate invoice={{ lr_date: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailLrDate invoice={{ lr_date: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from invoice_date, created_at, lr_number, or nested lr", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailLrDate
                invoice={{
                    invoice_date: "2026-01-01",
                    created_at: "2026-02-02T10:00:00.000Z",
                    dispatch_date: "2026-03-03",
                    invoice_number: "INV-44",
                    notes: "Paid at shop",
                    bill_image: "https://cdn.example/bill.jpg",
                    payment_status: "PAID",
                    supplier_name: "ABC Foods",
                    lr_number: "LR-999",
                    lr_no: "888",
                    lr: { date: "2026-04-04" },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
