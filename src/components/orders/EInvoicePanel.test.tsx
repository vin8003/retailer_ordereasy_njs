import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EInvoicePanel } from "./EInvoicePanel";

describe("EInvoicePanel", () => {
    it("shows the e-invoice panel with ack_date when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <EInvoicePanel invoice={{ ack_date: "2026-09-18 10:15:00" }} />
        );
        expect(markup).toContain("E-Invoice");
        expect(markup).toContain("Ack date");
        expect(markup).toContain("2026-09-18 10:15:00");
    });

    it("renders nothing when ack_date is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<EInvoicePanel invoice={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<EInvoicePanel invoice={{ ack_date: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<EInvoicePanel invoice={{ ack_date: "  " }} />)
        ).toBe("");
    });

    it("does not invent ack_date from created_at, invoice_date, aliases, irn, or nested e_invoice", () => {
        const markup = renderToStaticMarkup(
            <EInvoicePanel
                invoice={{
                    created_at: "2026-09-18T10:00:00.000Z",
                    invoice_date: "2026-09-17",
                    AckDt: "2026-09-16",
                    ack_dt: "2026-09-15",
                    acknowledgement_date: "2026-09-14",
                    irn: "IRN-DUMMY-1",
                    ack_no: "12345",
                    e_invoice: { ack_date: "2026-01-01" },
                }}
            />
        );
        expect(markup).toBe("");
    });
});
