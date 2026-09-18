import { describe, expect, it } from "vitest";
import { getChequeNumberLabel } from "./chequeNumber";

describe("getChequeNumberLabel", () => {
    it("returns the trimmed cheque_number when BE sent a non-empty value", () => {
        expect(getChequeNumberLabel({ cheque_number: "CHQ-90210" })).toBe("CHQ-90210");
        expect(getChequeNumberLabel({ cheque_number: "  441122  " })).toBe("441122");
        expect(getChequeNumberLabel({ cheque_number: 441122 })).toBe("441122");
        expect(getChequeNumberLabel({ cheque_number: 0 })).toBe("0");
        expect(getChequeNumberLabel({ cheque_number: "0" })).toBe("0");
    });

    it("returns null when cheque_number is omitted, null, or blank", () => {
        expect(getChequeNumberLabel({})).toBeNull();
        expect(getChequeNumberLabel({ cheque_number: undefined })).toBeNull();
        expect(getChequeNumberLabel({ cheque_number: null })).toBeNull();
        expect(getChequeNumberLabel({ cheque_number: "" })).toBeNull();
        expect(getChequeNumberLabel({ cheque_number: "   " })).toBeNull();
    });

    it("does not invent cheque_number from cheque, cheque_no, payment_reference_id, notes, or payment_mode", () => {
        expect(
            getChequeNumberLabel({
                cheque: { number: "NESTED-99" },
                cheque_no: "ALIAS-88",
                check_number: "US-SPELLING",
                payment_reference_id: "HIDDENREF0001",
                order_number: "OE-POS101",
                payment_mode: "cheque",
                notes: "Cheque CHQ-90210",
                upi_ref: "AXIS123456789012",
            })
        ).toBeNull();
        expect(
            getChequeNumberLabel({
                cheque: { number: "NESTED-99" },
                cheque_no: "ALIAS-88",
                payment_reference_id: "HIDDENREF0001",
                payment_mode: "cheque",
                cheque_number: null,
            })
        ).toBeNull();
        expect(
            getChequeNumberLabel({
                cheque: { number: "NESTED-99" },
                cheque_no: "ALIAS-88",
                check_number: "US-SPELLING",
                payment_reference_id: "HIDDENREF0001",
                notes: "Cheque ALIAS-88",
                payment_mode: "cheque",
                cheque_number: "CHQ-90210",
            })
        ).toBe("CHQ-90210");
    });

    it("returns null for non-finite numeric cheque_number", () => {
        expect(getChequeNumberLabel({ cheque_number: Number.NaN })).toBeNull();
        expect(getChequeNumberLabel({ cheque_number: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
