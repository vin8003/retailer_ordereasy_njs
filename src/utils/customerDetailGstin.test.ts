import { describe, expect, it } from "vitest";
import { getCustomerGstin } from "./customerDetailGstin";

describe("getCustomerGstin", () => {
    it("returns the trimmed gstin when BE sent a non-empty string", () => {
        expect(getCustomerGstin({ gstin: "27AAPFU0939F1ZV" })).toBe("27AAPFU0939F1ZV");
        expect(getCustomerGstin({ gstin: "  22AAAAA0000A1Z5  " })).toBe("22AAAAA0000A1Z5");
    });

    it("returns null when gstin is omitted, null, or blank", () => {
        expect(getCustomerGstin({})).toBeNull();
        expect(getCustomerGstin({ gstin: undefined })).toBeNull();
        expect(getCustomerGstin({ gstin: null })).toBeNull();
        expect(getCustomerGstin({ gstin: "" })).toBeNull();
        expect(getCustomerGstin({ gstin: "   " })).toBeNull();
    });

    it("does not invent gstin from notes, gst_number, name, phone, email, or balance", () => {
        expect(
            getCustomerGstin({
                notes: "Prefers morning delivery",
                gst_number: "27AAPFU0939F1ZV",
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: "ravi@example.com",
                current_balance: 2500,
            })
        ).toBeNull();
        expect(
            getCustomerGstin({
                notes: "Prefers morning delivery",
                gst_number: "27AAPFU0939F1ZV",
                customer_name: "Ravi",
                phone_number: "9999999999",
                email: "ravi@example.com",
                current_balance: 2500,
                gstin: null,
            })
        ).toBeNull();
    });
});
