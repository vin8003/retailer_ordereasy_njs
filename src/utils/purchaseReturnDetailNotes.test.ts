import { describe, expect, it } from "vitest";
import { getPurchaseReturnDetailNotes } from "./purchaseReturnDetailNotes";

describe("getPurchaseReturnDetailNotes", () => {
    it("returns the trimmed notes when BE sent a non-empty string", () => {
        expect(getPurchaseReturnDetailNotes({ notes: "Damaged carton" })).toBe("Damaged carton");
        expect(getPurchaseReturnDetailNotes({ notes: "  Short expiry  " })).toBe("Short expiry");
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getPurchaseReturnDetailNotes({})).toBeNull();
        expect(getPurchaseReturnDetailNotes({ notes: undefined })).toBeNull();
        expect(getPurchaseReturnDetailNotes({ notes: null })).toBeNull();
        expect(getPurchaseReturnDetailNotes({ notes: "" })).toBeNull();
        expect(getPurchaseReturnDetailNotes({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from return_number, invoice_number, or supplier_name", () => {
        expect(
            getPurchaseReturnDetailNotes({
                return_number: "RET-12",
                invoice_number: "INV-44",
                supplier_name: "ABC Foods",
            })
        ).toBeNull();
        expect(
            getPurchaseReturnDetailNotes({
                return_number: "RET-12",
                invoice_number: "INV-44",
                supplier_name: "ABC Foods",
                notes: null,
            })
        ).toBeNull();
    });
});
