import { describe, expect, it } from "vitest";
import {
    getSupplierEmailLabel,
    getSupplierPhoneLabel,
} from "./supplierDetailContact";

describe("getSupplierEmailLabel", () => {
    it("returns the trimmed email when BE sent a non-empty string", () => {
        expect(getSupplierEmailLabel({ email: "vendor@example.com" })).toBe("vendor@example.com");
        expect(getSupplierEmailLabel({ email: "  a@b.co  " })).toBe("a@b.co");
    });

    it("returns null when email is omitted, null, or blank", () => {
        expect(getSupplierEmailLabel({})).toBeNull();
        expect(getSupplierEmailLabel({ email: undefined })).toBeNull();
        expect(getSupplierEmailLabel({ email: null })).toBeNull();
        expect(getSupplierEmailLabel({ email: "" })).toBeNull();
        expect(getSupplierEmailLabel({ email: "   " })).toBeNull();
    });

    it("does not invent email from name, phone, gst, or payment terms", () => {
        expect(
            getSupplierEmailLabel({
                company_name: "Acme Distributors",
                contact_person: "Ravi",
                phone_number: "9999999999",
                gst_number: "27AAPFU0939F1ZV",
                payment_terms: "Net 15",
                email: null,
            })
        ).toBeNull();
    });
});

describe("getSupplierPhoneLabel", () => {
    it("returns the trimmed phone when BE sent a non-empty string", () => {
        expect(getSupplierPhoneLabel({ phone_number: "9876543210" })).toBe("9876543210");
        expect(getSupplierPhoneLabel({ phone_number: "  022-1234  " })).toBe("022-1234");
    });

    it("returns null when phone is omitted, null, or blank", () => {
        expect(getSupplierPhoneLabel({})).toBeNull();
        expect(getSupplierPhoneLabel({ phone_number: undefined })).toBeNull();
        expect(getSupplierPhoneLabel({ phone_number: null })).toBeNull();
        expect(getSupplierPhoneLabel({ phone_number: "" })).toBeNull();
        expect(getSupplierPhoneLabel({ phone_number: "   " })).toBeNull();
    });

    it("does not invent phone from name, email, gst, or payment terms", () => {
        expect(
            getSupplierPhoneLabel({
                company_name: "Acme Distributors",
                contact_person: "Ravi",
                email: "vendor@example.com",
                gst_number: "27AAPFU0939F1ZV",
                payment_terms: "Net 15",
                phone_number: null,
            })
        ).toBeNull();
    });
});
