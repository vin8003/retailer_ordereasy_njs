import { describe, expect, it } from "vitest";
import { getPurchaseInvoiceNotes } from "./purchaseInvoiceNotes";

describe("getPurchaseInvoiceNotes", () => {
    it("returns the trimmed notes when BE sent a non-empty string", () => {
        expect(getPurchaseInvoiceNotes({ notes: "Paid at shop" })).toBe("Paid at shop");
        expect(getPurchaseInvoiceNotes({ notes: "  COD leftover  " })).toBe("COD leftover");
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getPurchaseInvoiceNotes({})).toBeNull();
        expect(getPurchaseInvoiceNotes({ notes: undefined })).toBeNull();
        expect(getPurchaseInvoiceNotes({ notes: null })).toBeNull();
        expect(getPurchaseInvoiceNotes({ notes: "" })).toBeNull();
        expect(getPurchaseInvoiceNotes({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from invoice_number, payment_status, or supplier_name", () => {
        expect(
            getPurchaseInvoiceNotes({
                invoice_number: "INV-44",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
            })
        ).toBeNull();
        expect(
            getPurchaseInvoiceNotes({
                invoice_number: "INV-44",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
                notes: null,
            })
        ).toBeNull();
    });
});
