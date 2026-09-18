import { describe, expect, it } from "vitest";
import { getSalesReturnDetailNotes } from "./salesReturnDetailNotes";

describe("getSalesReturnDetailNotes", () => {
    it("returns the trimmed notes when BE sent a non-empty string", () => {
        expect(getSalesReturnDetailNotes({ notes: "Damaged on delivery" })).toBe(
            "Damaged on delivery"
        );
        expect(getSalesReturnDetailNotes({ notes: "  Wrong item  " })).toBe("Wrong item");
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getSalesReturnDetailNotes({})).toBeNull();
        expect(getSalesReturnDetailNotes({ notes: undefined })).toBeNull();
        expect(getSalesReturnDetailNotes({ notes: null })).toBeNull();
        expect(getSalesReturnDetailNotes({ notes: "" })).toBeNull();
        expect(getSalesReturnDetailNotes({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from reason, order_number, customer_name, or refund mode", () => {
        expect(
            getSalesReturnDetailNotes({
                reason: "Damaged product",
                order_number: "OE-1001",
                customer_name: "Ravi",
                return_number: "SRET-12",
                refund_payment_mode: "cash",
            })
        ).toBeNull();
        expect(
            getSalesReturnDetailNotes({
                reason: "Damaged product",
                order_number: "OE-1001",
                customer_name: "Ravi",
                return_number: "SRET-12",
                refund_payment_mode: "cash",
                notes: null,
            })
        ).toBeNull();
    });
});
