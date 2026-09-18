import { describe, expect, it } from "vitest";
import { getEInvoiceAckNoLabel, resolveEInvoiceAckSource } from "./eInvoiceAckNo";

describe("getEInvoiceAckNoLabel", () => {
    it("returns the ack_no text when BE sent a present non-empty value", () => {
        expect(getEInvoiceAckNoLabel({ ack_no: 112010012345678 })).toBe("112010012345678");
        expect(getEInvoiceAckNoLabel({ ack_no: "1210000123" })).toBe("1210000123");
        expect(getEInvoiceAckNoLabel({ ack_no: "  99  " })).toBe("99");
        expect(getEInvoiceAckNoLabel({ ack_no: 0 })).toBe("0");
        expect(getEInvoiceAckNoLabel({ ack_no: "0" })).toBe("0");
    });

    it("returns null when ack_no is omitted, null, or blank", () => {
        expect(getEInvoiceAckNoLabel({})).toBeNull();
        expect(getEInvoiceAckNoLabel({ ack_no: undefined })).toBeNull();
        expect(getEInvoiceAckNoLabel({ ack_no: null })).toBeNull();
        expect(getEInvoiceAckNoLabel({ ack_no: "" })).toBeNull();
        expect(getEInvoiceAckNoLabel({ ack_no: "   " })).toBeNull();
    });

    it("does not invent ack_no from irn, invoice_number, ack_dt, or AckNo", () => {
        expect(
            getEInvoiceAckNoLabel({
                irn: "a5c12d1e0f",
                invoice_number: "INV-88",
                order_number: "OE-1001",
                ack_dt: "2026-09-18 10:30:00",
                acknowledgement_number: "999",
                AckNo: "1210000999",
                ack_no: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric ack_no", () => {
        expect(getEInvoiceAckNoLabel({ ack_no: Number.NaN })).toBeNull();
        expect(getEInvoiceAckNoLabel({ ack_no: Number.POSITIVE_INFINITY })).toBeNull();
    });
});

describe("resolveEInvoiceAckSource", () => {
    it("prefers a nested e_invoice object when BE sent one", () => {
        expect(
            resolveEInvoiceAckSource({
                ack_no: "top-level",
                e_invoice: { ack_no: "nested-ack" },
            })
        ).toEqual({ ack_no: "nested-ack" });
    });

    it("falls back to the payload itself when e_invoice is missing or not an object", () => {
        const top = { ack_no: "1210000123", irn: "abc" };
        expect(resolveEInvoiceAckSource(top)).toBe(top);
        expect(resolveEInvoiceAckSource({ ack_no: "1210000123", e_invoice: null })).toEqual({
            ack_no: "1210000123",
            e_invoice: null,
        });
        expect(resolveEInvoiceAckSource({ ack_no: "1210000123", e_invoice: "nope" })).toEqual({
            ack_no: "1210000123",
            e_invoice: "nope",
        });
    });
});
