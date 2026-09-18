import { describe, expect, it } from "vitest";
import {
    SALES_RETURN_NOTES_SNIPPET_MAX,
    getSalesReturnNotesSnippet,
} from "./salesReturnListNotes";

describe("getSalesReturnNotesSnippet", () => {
    it("returns the trimmed notes when BE sent a short non-empty string", () => {
        expect(getSalesReturnNotesSnippet({ notes: "Wrong size" })).toBe("Wrong size");
        expect(getSalesReturnNotesSnippet({ notes: "  Damaged box  " })).toBe("Damaged box");
    });

    it("clips long notes to a list snippet", () => {
        const long = "x".repeat(SALES_RETURN_NOTES_SNIPPET_MAX + 12);
        const snippet = getSalesReturnNotesSnippet({ notes: long });
        expect(snippet).toBe(`${"x".repeat(SALES_RETURN_NOTES_SNIPPET_MAX)}…`);
        expect(snippet?.endsWith("…")).toBe(true);
        expect(snippet?.length).toBe(SALES_RETURN_NOTES_SNIPPET_MAX + 1);
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getSalesReturnNotesSnippet({})).toBeNull();
        expect(getSalesReturnNotesSnippet({ notes: undefined })).toBeNull();
        expect(getSalesReturnNotesSnippet({ notes: null })).toBeNull();
        expect(getSalesReturnNotesSnippet({ notes: "" })).toBeNull();
        expect(getSalesReturnNotesSnippet({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from reason, order_number, customer_name, or refund mode", () => {
        expect(
            getSalesReturnNotesSnippet({
                reason: "Damaged product",
                order_number: "OE-1001",
                customer_name: "Ravi",
                return_number: "SRET-12",
                refund_payment_mode: "upi",
            })
        ).toBeNull();
        expect(
            getSalesReturnNotesSnippet({
                reason: "Damaged product",
                order_number: "OE-1001",
                customer_name: "Ravi",
                return_number: "SRET-12",
                refund_payment_mode: "upi",
                notes: null,
            })
        ).toBeNull();
    });
});
