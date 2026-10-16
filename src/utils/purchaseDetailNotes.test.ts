import { describe, expect, it } from "vitest";
import { getPurchaseDetailNotes } from "./purchaseDetailNotes";

describe("getPurchaseDetailNotes", () => {
    it("returns the trimmed notes when BE sent a non-empty string", () => {
        expect(getPurchaseDetailNotes({ notes: "Paid at shop" })).toBe("Paid at shop");
        expect(getPurchaseDetailNotes({ notes: "  COD leftover  " })).toBe("COD leftover");
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getPurchaseDetailNotes({})).toBeNull();
        expect(getPurchaseDetailNotes({ notes: undefined })).toBeNull();
        expect(getPurchaseDetailNotes({ notes: null })).toBeNull();
        expect(getPurchaseDetailNotes({ notes: "" })).toBeNull();
        expect(getPurchaseDetailNotes({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from invoice_number, payment_status, or supplier_name", () => {
        expect(
            getPurchaseDetailNotes({
                invoice_number: "INV-44",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
            })
        ).toBeNull();
        expect(
            getPurchaseDetailNotes({
                invoice_number: "INV-44",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
                notes: null,
            })
        ).toBeNull();
    });
});
