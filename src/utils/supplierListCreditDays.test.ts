import { describe, expect, it } from "vitest";
import { getSupplierCreditDaysLabel } from "./supplierListCreditDays";

describe("getSupplierCreditDaysLabel", () => {
    it("formats a present credit_days value, including 0", () => {
        expect(getSupplierCreditDaysLabel({ credit_days: 15 })).toBe("15 days");
        expect(getSupplierCreditDaysLabel({ credit_days: "7" })).toBe("7 days");
        expect(getSupplierCreditDaysLabel({ credit_days: 1 })).toBe("1 day");
        expect(getSupplierCreditDaysLabel({ credit_days: 0 })).toBe("0 days");
        expect(getSupplierCreditDaysLabel({ credit_days: "0" })).toBe("0 days");
        expect(getSupplierCreditDaysLabel({ credit_days: "  30  " })).toBe("30 days");
    });

    it("returns null when credit_days is omitted, null, or blank", () => {
        expect(getSupplierCreditDaysLabel({})).toBeNull();
        expect(getSupplierCreditDaysLabel({ credit_days: undefined })).toBeNull();
        expect(getSupplierCreditDaysLabel({ credit_days: null })).toBeNull();
        expect(getSupplierCreditDaysLabel({ credit_days: "" })).toBeNull();
        expect(getSupplierCreditDaysLabel({ credit_days: "   " })).toBeNull();
    });

    it("does not invent credit_days from email, payment_terms, gst, balance, or credit_due_days", () => {
        expect(
            getSupplierCreditDaysLabel({
                email: "buyer@example.com",
                payment_terms: "Net 30",
                gst_number: "27AAAAA0000A1Z5",
                balance_due: 2500,
                credit_due_days: 15,
                credit_days: null,
            })
        ).toBeNull();
    });

    it("returns null for non-numeric or non-finite present values", () => {
        expect(getSupplierCreditDaysLabel({ credit_days: "n/a" })).toBeNull();
        expect(getSupplierCreditDaysLabel({ credit_days: Number.NaN })).toBeNull();
        expect(getSupplierCreditDaysLabel({ credit_days: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
