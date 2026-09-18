import { describe, expect, it } from "vitest";
import { getKhataLedgerNotes } from "./khataLedgerNotes";

describe("getKhataLedgerNotes", () => {
    it("returns the trimmed notes when BE sent a non-empty string", () => {
        expect(getKhataLedgerNotes({ notes: "Paid at shop" })).toBe("Paid at shop");
        expect(getKhataLedgerNotes({ notes: "  COD leftover  " })).toBe("COD leftover");
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getKhataLedgerNotes({})).toBeNull();
        expect(getKhataLedgerNotes({ notes: undefined })).toBeNull();
        expect(getKhataLedgerNotes({ notes: null })).toBeNull();
        expect(getKhataLedgerNotes({ notes: "" })).toBeNull();
        expect(getKhataLedgerNotes({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from order, type, payment mode, amount, or description", () => {
        expect(
            getKhataLedgerNotes({
                order_number: "OE-101",
                transaction_type: "PAYMENT",
                payment_mode: "UPI",
                amount: 250,
                description: "Khata settlement",
            })
        ).toBeNull();
        expect(
            getKhataLedgerNotes({
                order_number: "OE-101",
                transaction_type: "PAYMENT",
                payment_mode: "UPI",
                amount: 250,
                description: "Khata settlement",
                notes: null,
            })
        ).toBeNull();
    });
});
