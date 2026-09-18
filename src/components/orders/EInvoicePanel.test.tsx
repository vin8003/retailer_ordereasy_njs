import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EInvoicePanel } from "./EInvoicePanel";

describe("EInvoicePanel", () => {
    it("shows the e-invoice panel with ack_no when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <EInvoicePanel invoice={{ ack_no: "1210000123" }} />
        );
        expect(markup).toContain("E-Invoice");
        expect(markup).toContain("Ack No");
        expect(markup).toContain("1210000123");
        expect(markup).toContain("Ack No 1210000123");
    });

    it("shows nested e_invoice.ack_no and ignores a conflicting top-level value", () => {
        const markup = renderToStaticMarkup(
            <EInvoicePanel
                invoice={{
                    ack_no: "should-not-show",
                    e_invoice: { ack_no: "1210000456" },
                }}
            />
        );
        expect(markup).toContain("1210000456");
        expect(markup).not.toContain("should-not-show");
    });

    it("renders nothing when ack_no is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<EInvoicePanel invoice={{}} />)).toBe("");
        expect(renderToStaticMarkup(<EInvoicePanel invoice={{ ack_no: null }} />)).toBe("");
        expect(renderToStaticMarkup(<EInvoicePanel invoice={{ ack_no: "" }} />)).toBe("");
        expect(renderToStaticMarkup(<EInvoicePanel invoice={{ ack_no: "   " }} />)).toBe("");
        expect(
            renderToStaticMarkup(<EInvoicePanel invoice={{ e_invoice: { ack_no: null } }} />)
        ).toBe("");
    });

    it("does not invent ack_no from irn, invoice_number, ack_dt, or AckNo", () => {
        const markup = renderToStaticMarkup(
            <EInvoicePanel
                invoice={{
                    irn: "a5c12d1e0f",
                    invoice_number: "INV-88",
                    order_number: "OE-1001",
                    ack_dt: "2026-09-18 10:30:00",
                    acknowledgement_number: "999",
                    AckNo: "1210000999",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
