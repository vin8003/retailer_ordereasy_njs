import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseDetailIrn } from "./PurchaseDetailIrn";

const DUMMY_IRN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("PurchaseDetailIrn", () => {
    it("shows muted IRN text when BE sent irn", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailIrn invoice={{ irn: DUMMY_IRN }} />
        );
        expect(markup).toContain(DUMMY_IRN);
        expect(markup).toContain(`IRN ${DUMMY_IRN}`);
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<PurchaseDetailIrn invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailIrn invoice={{ irn: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailIrn invoice={{ irn: "" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<PurchaseDetailIrn invoice={{ irn: "   " }} />)
        ).toBe("");
    });

    it("does not invent a label from invoice_number, notes, ack, eway, or nested e-invoice", () => {
        const markup = renderToStaticMarkup(
            <PurchaseDetailIrn
                invoice={{
                    invoice_number: "INV-44",
                    notes: "Paid at shop",
                    bill_image: "https://cdn.example/bill.jpg",
                    payment_status: "PAID",
                    supplier_name: "ABC Foods",
                    eway_bill: "141234567890",
                    ack_no: "112233",
                    irn_number: "should-not-use",
                    signed_qr: "qr-payload",
                    e_invoice: { irn: DUMMY_IRN },
                    einvoice: { irn: DUMMY_IRN },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
