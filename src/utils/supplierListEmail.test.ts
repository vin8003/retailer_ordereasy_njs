import { describe, expect, it } from "vitest";
import { getSupplierEmailLabel } from "./supplierListEmail";

describe("getSupplierEmailLabel", () => {
    it("returns the trimmed email when BE sent a non-empty string", () => {
        expect(getSupplierEmailLabel({ email: "shop@example.com" })).toBe("shop@example.com");
        expect(getSupplierEmailLabel({ email: "  a@b.co  " })).toBe("a@b.co");
    });

    it("returns null when email is omitted, null, or blank", () => {
        expect(getSupplierEmailLabel({})).toBeNull();
        expect(getSupplierEmailLabel({ email: undefined })).toBeNull();
        expect(getSupplierEmailLabel({ email: null })).toBeNull();
        expect(getSupplierEmailLabel({ email: "" })).toBeNull();
        expect(getSupplierEmailLabel({ email: "   " })).toBeNull();
    });

    it("does not invent email from company name, contact, or phone", () => {
        expect(
            getSupplierEmailLabel({
                company_name: "Acme Distributors",
                contact_person: "Ravi",
                phone_number: "9999999999",
                email: null,
            })
        ).toBeNull();
    });
});
