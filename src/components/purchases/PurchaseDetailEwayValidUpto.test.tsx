import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseDetailEwayValidUpto } from "./PurchaseDetailEwayValidUpto";

describe("PurchaseDetailEwayValidUpto", () => {
    it("shows muted e-way valid-upto text when BE sent eway_valid_upto", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailEwayValidUpto invoice={{ eway_valid_upto: "2026-09-20 23:59:00" }} />
        );
        expect(markup).toContain("2026-09-20 23:59:00");
        expect(markup).toContain("E-way valid upto 2026-09-20 23:59:00");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseDetailEwayValidUpto invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseDetailEwayValidUpto invoice={{ eway_valid_upto: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseDetailEwayValidUpto invoice={{ eway_valid_upto: "" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseDetailEwayValidUpto invoice={{ eway_valid_upto: "   " }} />
            )
        ).toBe("");
    });

    it("does not invent a label from invoice_date, eway_bill, or nested eway", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailEwayValidUpto
                invoice={{
                    invoice_number: "INV-44",
                    notes: "Paid at shop",
                    bill_image: "https://cdn.example/bill.jpg",
                    payment_status: "PAID",
                    supplier_name: "ABC Foods",
                    invoice_date: "2026-09-18",
                    eway_bill: "141234567890",
                    eway_bill_number: "888",
                    valid_upto: "2026-12-31",
                    ewb_valid_upto: "2026-10-01",
                    eway: { valid_upto: "2026-11-01" },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
