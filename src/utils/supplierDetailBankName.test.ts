import { describe, expect, it } from "vitest";
import { getSupplierBankNameLabel } from "./supplierDetailBankName";

describe("getSupplierBankNameLabel", () => {
    it("returns the trimmed bank_name when BE sent a non-empty string", () => {
        expect(getSupplierBankNameLabel({ bank_name: "HDFC Bank" })).toBe("HDFC Bank");
        expect(getSupplierBankNameLabel({ bank_name: "  ICICI  " })).toBe("ICICI");
    });

    it("returns null when bank_name is omitted, null, or blank", () => {
        expect(getSupplierBankNameLabel({})).toBeNull();
        expect(getSupplierBankNameLabel({ bank_name: undefined })).toBeNull();
        expect(getSupplierBankNameLabel({ bank_name: null })).toBeNull();
        expect(getSupplierBankNameLabel({ bank_name: "" })).toBeNull();
        expect(getSupplierBankNameLabel({ bank_name: "   " })).toBeNull();
    });

    it("does not invent bank_name from name, contact, gst, terms, or nested bank", () => {
        expect(
            getSupplierBankNameLabel({
                company_name: "Acme Distributors",
                contact_person: "Ravi",
                email: "vendor@example.com",
                phone_number: "9999999999",
                gst_number: "27AAPFU0939F1ZV",
                payment_terms: "Net 15",
                bank: { name: "SBI" },
                bank_name: null,
            })
        ).toBeNull();
    });
});
