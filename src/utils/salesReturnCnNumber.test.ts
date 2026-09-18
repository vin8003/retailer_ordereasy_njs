import { describe, expect, it } from "vitest";
import { getSalesReturnCnNumberLabel } from "./salesReturnCnNumber";

describe("getSalesReturnCnNumberLabel", () => {
    it("returns the cn_number text when BE sent a present non-empty value", () => {
        expect(getSalesReturnCnNumberLabel({ cn_number: "CN-1001" })).toBe("CN-1001");
        expect(getSalesReturnCnNumberLabel({ cn_number: 42 })).toBe("42");
        expect(getSalesReturnCnNumberLabel({ cn_number: "  CN-7  " })).toBe("CN-7");
        expect(getSalesReturnCnNumberLabel({ cn_number: 0 })).toBe("0");
        expect(getSalesReturnCnNumberLabel({ cn_number: "0" })).toBe("0");
    });

    it("returns null when cn_number is omitted, null, or blank", () => {
        expect(getSalesReturnCnNumberLabel({})).toBeNull();
        expect(getSalesReturnCnNumberLabel({ cn_number: undefined })).toBeNull();
        expect(getSalesReturnCnNumberLabel({ cn_number: null })).toBeNull();
        expect(getSalesReturnCnNumberLabel({ cn_number: "" })).toBeNull();
        expect(getSalesReturnCnNumberLabel({ cn_number: "   " })).toBeNull();
    });

    it("does not invent cn_number from return_number, notes, reason, or nested credit_note", () => {
        expect(
            getSalesReturnCnNumberLabel({
                id: 99,
                return_number: "SRET-12",
                order_number: "OE-1001",
                customer_name: "Ravi",
                reason: "Damaged product",
                notes: "Opened pack",
                credit_note_id: 55,
                credit_note: { id: 55, cn_number: "CN-NESTED" },
                cn_number: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric cn_number", () => {
        expect(getSalesReturnCnNumberLabel({ cn_number: Number.NaN })).toBeNull();
        expect(getSalesReturnCnNumberLabel({ cn_number: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
