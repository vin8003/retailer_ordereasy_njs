import { describe, expect, it } from "vitest";
import { getKhataDetailReferenceNo } from "./khataDetailReference";

describe("getKhataDetailReferenceNo", () => {
    it("returns the reference_no text when BE sent a present non-empty value", () => {
        expect(getKhataDetailReferenceNo({ reference_no: "UTR-9911" })).toBe("UTR-9911");
        expect(getKhataDetailReferenceNo({ reference_no: 88 })).toBe("88");
        expect(getKhataDetailReferenceNo({ reference_no: "  CHQ-7  " })).toBe("CHQ-7");
        expect(getKhataDetailReferenceNo({ reference_no: 0 })).toBe("0");
        expect(getKhataDetailReferenceNo({ reference_no: "0" })).toBe("0");
    });

    it("returns null when reference_no is omitted, null, or blank", () => {
        expect(getKhataDetailReferenceNo({})).toBeNull();
        expect(getKhataDetailReferenceNo({ reference_no: undefined })).toBeNull();
        expect(getKhataDetailReferenceNo({ reference_no: null })).toBeNull();
        expect(getKhataDetailReferenceNo({ reference_no: "" })).toBeNull();
        expect(getKhataDetailReferenceNo({ reference_no: "   " })).toBeNull();
    });

    it("does not invent reference_no from notes, order, payment, or description", () => {
        expect(
            getKhataDetailReferenceNo({
                id: 99,
                notes: "Paid at shop",
                order_number: "OE-101",
                payment_mode: "UPI",
                payment_reference_id: "pay_abc",
                description: "Khata settlement",
                transaction_type: "PAYMENT",
                amount: 250,
            })
        ).toBeNull();
        expect(
            getKhataDetailReferenceNo({
                notes: "Paid at shop",
                order_number: "OE-101",
                payment_reference_id: "pay_abc",
                reference_no: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric reference_no", () => {
        expect(getKhataDetailReferenceNo({ reference_no: Number.NaN })).toBeNull();
        expect(
            getKhataDetailReferenceNo({ reference_no: Number.POSITIVE_INFINITY })
        ).toBeNull();
    });
});
