import { describe, expect, it } from "vitest";
import { getPurchaseDetailIrn } from "./purchaseDetailIrn";

const DUMMY_IRN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("getPurchaseDetailIrn", () => {
    it("returns the irn text when BE sent a present non-empty value", () => {
        expect(getPurchaseDetailIrn({ irn: DUMMY_IRN })).toBe(DUMMY_IRN);
        expect(getPurchaseDetailIrn({ irn: "  dummy-irn-1  " })).toBe("dummy-irn-1");
        expect(getPurchaseDetailIrn({ irn: 0 })).toBe("0");
        expect(getPurchaseDetailIrn({ irn: "0" })).toBe("0");
        expect(getPurchaseDetailIrn({ irn: 42 })).toBe("42");
    });

    it("returns null when irn is omitted, null, or blank", () => {
        expect(getPurchaseDetailIrn({})).toBeNull();
        expect(getPurchaseDetailIrn({ irn: undefined })).toBeNull();
        expect(getPurchaseDetailIrn({ irn: null })).toBeNull();
        expect(getPurchaseDetailIrn({ irn: "" })).toBeNull();
        expect(getPurchaseDetailIrn({ irn: "   " })).toBeNull();
    });

    it("does not invent irn from invoice_number, notes, ack, eway, or nested e-invoice", () => {
        expect(
            getPurchaseDetailIrn({
                invoice_number: "INV-44",
                notes: "Paid at shop",
                bill_image: "https://cdn.example/bill.jpg",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
                eway_bill: "141234567890",
                ack_no: "112233",
                ack_dt: "2026-09-18",
                irn_number: "should-not-use",
                signed_qr: "qr-payload",
                e_invoice: { irn: DUMMY_IRN },
                einvoice: { irn: DUMMY_IRN },
                irn: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric irn", () => {
        expect(getPurchaseDetailIrn({ irn: Number.NaN })).toBeNull();
        expect(getPurchaseDetailIrn({ irn: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
