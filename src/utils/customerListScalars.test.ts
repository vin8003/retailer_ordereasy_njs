import { describe, expect, it } from "vitest";
import {
    getCreditDueDaysLabel,
    getCreditLimitLabel,
    getCustomerEmailLabel,
} from "./customerListScalars";

const formatInr = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);

describe("getCustomerEmailLabel", () => {
    it("returns the trimmed email when BE sent a non-empty string", () => {
        expect(getCustomerEmailLabel({ email: "shop@example.com" })).toBe("shop@example.com");
        expect(getCustomerEmailLabel({ email: "  a@b.co  " })).toBe("a@b.co");
    });

    it("returns null when email is omitted, null, or blank", () => {
        expect(getCustomerEmailLabel({})).toBeNull();
        expect(getCustomerEmailLabel({ email: undefined })).toBeNull();
        expect(getCustomerEmailLabel({ email: null })).toBeNull();
        expect(getCustomerEmailLabel({ email: "" })).toBeNull();
        expect(getCustomerEmailLabel({ email: "   " })).toBeNull();
    });

    it("does not invent email from name or phone", () => {
        expect(
            getCustomerEmailLabel({
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: null,
            })
        ).toBeNull();
    });
});

describe("getCreditLimitLabel", () => {
    it("formats a present numeric credit_limit as compact INR, including 0", () => {
        expect(getCreditLimitLabel({ credit_limit: 10000 })).toBe(formatInr(10000));
        expect(getCreditLimitLabel({ credit_limit: "5000.00" })).toBe(formatInr(5000));
        expect(getCreditLimitLabel({ credit_limit: 0 })).toBe(formatInr(0));
        expect(getCreditLimitLabel({ credit_limit: "0" })).toBe(formatInr(0));
    });

    it("returns null when credit_limit is omitted, null, or blank", () => {
        expect(getCreditLimitLabel({})).toBeNull();
        expect(getCreditLimitLabel({ credit_limit: undefined })).toBeNull();
        expect(getCreditLimitLabel({ credit_limit: null })).toBeNull();
        expect(getCreditLimitLabel({ credit_limit: "" })).toBeNull();
        expect(getCreditLimitLabel({ credit_limit: "   " })).toBeNull();
    });

    it("does not invent credit_limit from current_balance or other fields", () => {
        expect(
            getCreditLimitLabel({
                current_balance: 2500,
                credit_due_days: 15,
                credit_limit: null,
            })
        ).toBeNull();
    });

    it("returns null for non-numeric present values", () => {
        expect(getCreditLimitLabel({ credit_limit: "n/a" })).toBeNull();
    });
});

describe("getCreditDueDaysLabel", () => {
    it("formats a present credit_due_days value, including 0", () => {
        expect(getCreditDueDaysLabel({ credit_due_days: 15 })).toBe("15 days");
        expect(getCreditDueDaysLabel({ credit_due_days: "7" })).toBe("7 days");
        expect(getCreditDueDaysLabel({ credit_due_days: 1 })).toBe("1 day");
        expect(getCreditDueDaysLabel({ credit_due_days: 0 })).toBe("0 days");
        expect(getCreditDueDaysLabel({ credit_due_days: "0" })).toBe("0 days");
    });

    it("returns null when credit_due_days is omitted, null, or blank", () => {
        expect(getCreditDueDaysLabel({})).toBeNull();
        expect(getCreditDueDaysLabel({ credit_due_days: undefined })).toBeNull();
        expect(getCreditDueDaysLabel({ credit_due_days: null })).toBeNull();
        expect(getCreditDueDaysLabel({ credit_due_days: "" })).toBeNull();
        expect(getCreditDueDaysLabel({ credit_due_days: "   " })).toBeNull();
    });

    it("does not invent credit_due_days from credit_limit or other fields", () => {
        expect(
            getCreditDueDaysLabel({
                credit_limit: 10000,
                current_balance: 500,
                credit_due_days: null,
            })
        ).toBeNull();
    });

    it("returns null for non-numeric present values", () => {
        expect(getCreditDueDaysLabel({ credit_due_days: "n/a" })).toBeNull();
    });
});
