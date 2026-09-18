import { describe, expect, it } from "vitest";
import { getPurchaseInvoicePoNumber } from "./purchaseInvoicePoNumber";

describe("getPurchaseInvoicePoNumber", () => {
    it("returns the po_number text when BE sent a present non-empty value", () => {
        expect(getPurchaseInvoicePoNumber({ po_number: "PO-4412" })).toBe("PO-4412");
        expect(getPurchaseInvoicePoNumber({ po_number: "  PO-7  " })).toBe("PO-7");
        expect(getPurchaseInvoicePoNumber({ po_number: 88 })).toBe("88");
        expect(getPurchaseInvoicePoNumber({ po_number: 0 })).toBe("0");
        expect(getPurchaseInvoicePoNumber({ po_number: "0" })).toBe("0");
    });

    it("returns null when po_number is omitted, null, or blank", () => {
        expect(getPurchaseInvoicePoNumber({})).toBeNull();
        expect(getPurchaseInvoicePoNumber({ po_number: undefined })).toBeNull();
        expect(getPurchaseInvoicePoNumber({ po_number: null })).toBeNull();
        expect(getPurchaseInvoicePoNumber({ po_number: "" })).toBeNull();
        expect(getPurchaseInvoicePoNumber({ po_number: "   " })).toBeNull();
    });

    it("does not invent po_number from invoice_number, notes, payment_status, or supplier_name", () => {
        expect(
            getPurchaseInvoicePoNumber({
                invoice_number: "INV-44",
                notes: "Paid at shop",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
            })
        ).toBeNull();
        expect(
            getPurchaseInvoicePoNumber({
                invoice_number: "INV-44",
                notes: "Paid at shop",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
                po_number: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric po_number", () => {
        expect(getPurchaseInvoicePoNumber({ po_number: Number.NaN })).toBeNull();
        expect(getPurchaseInvoicePoNumber({ po_number: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
