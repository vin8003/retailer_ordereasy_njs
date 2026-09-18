import { describe, expect, it } from "vitest";
import { getEInvoiceAckDateLabel } from "./eInvoiceAckDate";

describe("getEInvoiceAckDateLabel", () => {
    it("returns the trimmed ack_date when BE sent a non-empty string", () => {
        expect(getEInvoiceAckDateLabel({ ack_date: "2026-09-18 10:15:00" })).toBe(
            "2026-09-18 10:15:00"
        );
        expect(getEInvoiceAckDateLabel({ ack_date: "  18/09/2026  " })).toBe("18/09/2026");
    });

    it("returns null when ack_date is omitted, null, or blank", () => {
        expect(getEInvoiceAckDateLabel({})).toBeNull();
        expect(getEInvoiceAckDateLabel({ ack_date: undefined })).toBeNull();
        expect(getEInvoiceAckDateLabel({ ack_date: null })).toBeNull();
        expect(getEInvoiceAckDateLabel({ ack_date: "" })).toBeNull();
        expect(getEInvoiceAckDateLabel({ ack_date: "   " })).toBeNull();
    });

    it("does not invent ack_date from created_at, invoice_date, aliases, irn, or nested e_invoice", () => {
        expect(
            getEInvoiceAckDateLabel({
                created_at: "2026-09-18T10:00:00.000Z",
                invoice_date: "2026-09-17",
                AckDt: "2026-09-16",
                ack_dt: "2026-09-15",
                acknowledgement_date: "2026-09-14",
                irn: "IRN-DUMMY-1",
                ack_no: "12345",
                e_invoice: { ack_date: "2026-01-01" },
                ack_date: null,
            })
        ).toBeNull();
    });
});
