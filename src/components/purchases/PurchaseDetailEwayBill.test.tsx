import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseDetailEwayBill } from "./PurchaseDetailEwayBill";

describe("PurchaseDetailEwayBill", () => {
    it("shows muted e-way bill text when BE sent eway_bill", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailEwayBill invoice={{ eway_bill: "141234567890" }} />
        );
        expect(markup).toContain("141234567890");
        expect(markup).toContain("E-way bill 141234567890");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseDetailEwayBill invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailEwayBill invoice={{ eway_bill: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailEwayBill invoice={{ eway_bill: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailEwayBill invoice={{ eway_bill: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from invoice_number, notes, bill_image, or nested eway", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailEwayBill
                invoice={{
                    invoice_number: "INV-44",
                    notes: "Paid at shop",
                    bill_image: "https://cdn.example/bill.jpg",
                    payment_status: "PAID",
                    supplier_name: "ABC Foods",
                    ewb_no: "999",
                    eway_bill_number: "888",
                    eway: { bill: "777" },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
