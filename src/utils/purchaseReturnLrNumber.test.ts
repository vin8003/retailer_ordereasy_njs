import { describe, expect, it } from "vitest";
import { getPurchaseReturnLrNumber } from "./purchaseReturnLrNumber";

describe("getPurchaseReturnLrNumber", () => {
    it("returns the lr_number text when BE sent a present non-empty value", () => {
        expect(getPurchaseReturnLrNumber({ lr_number: "LR-DUMMY-1001" })).toBe("LR-DUMMY-1001");
        expect(getPurchaseReturnLrNumber({ lr_number: "  DL998877  " })).toBe("DL998877");
        expect(getPurchaseReturnLrNumber({ lr_number: 88001 })).toBe("88001");
        expect(getPurchaseReturnLrNumber({ lr_number: 0 })).toBe("0");
        expect(getPurchaseReturnLrNumber({ lr_number: "0" })).toBe("0");
    });

    it("returns null when lr_number is omitted, null, or blank", () => {
        expect(getPurchaseReturnLrNumber({})).toBeNull();
        expect(getPurchaseReturnLrNumber({ lr_number: undefined })).toBeNull();
        expect(getPurchaseReturnLrNumber({ lr_number: null })).toBeNull();
        expect(getPurchaseReturnLrNumber({ lr_number: "" })).toBeNull();
        expect(getPurchaseReturnLrNumber({ lr_number: "   " })).toBeNull();
    });

    it("does not invent lr_number from return_number, invoice_number, notes, or id", () => {
        expect(
            getPurchaseReturnLrNumber({
                id: 77,
                return_number: "RET-77",
                invoice_number: "INV-44",
                supplier_name: "Dummy Distributors",
                notes: "send via transporter",
                tracking_number: "TRK-9",
                lr_number: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric lr_number", () => {
        expect(getPurchaseReturnLrNumber({ lr_number: Number.NaN })).toBeNull();
        expect(getPurchaseReturnLrNumber({ lr_number: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
