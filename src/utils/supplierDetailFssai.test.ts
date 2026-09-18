import { describe, expect, it } from "vitest";
import { getSupplierFssaiNumberLabel } from "./supplierDetailFssai";

describe("getSupplierFssaiNumberLabel", () => {
    it("returns the fssai_number text when BE sent a present non-empty value", () => {
        expect(getSupplierFssaiNumberLabel({ fssai_number: "10012022000012" })).toBe(
            "10012022000012"
        );
        expect(getSupplierFssaiNumberLabel({ fssai_number: "  10012022000012  " })).toBe(
            "10012022000012"
        );
        expect(getSupplierFssaiNumberLabel({ fssai_number: 10012022000012 })).toBe(
            "10012022000012"
        );
    });

    it("returns null when fssai_number is omitted, null, or blank", () => {
        expect(getSupplierFssaiNumberLabel({})).toBeNull();
        expect(getSupplierFssaiNumberLabel({ fssai_number: undefined })).toBeNull();
        expect(getSupplierFssaiNumberLabel({ fssai_number: null })).toBeNull();
        expect(getSupplierFssaiNumberLabel({ fssai_number: "" })).toBeNull();
        expect(getSupplierFssaiNumberLabel({ fssai_number: "   " })).toBeNull();
    });

    it("does not invent fssai_number from name, gst, terms, aliases, or nested fssai", () => {
        expect(
            getSupplierFssaiNumberLabel({
                company_name: "Acme Distributors",
                contact_person: "Ravi",
                email: "vendor@example.com",
                phone_number: "9999999999",
                gst_number: "27AAPFU0939F1ZV",
                payment_terms: "Net 15",
                fssai_no: "10012022000099",
                license_number: "LIC-1",
                fssai: { number: "10012022000088" },
                fssai_number: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric fssai_number", () => {
        expect(getSupplierFssaiNumberLabel({ fssai_number: Number.NaN })).toBeNull();
        expect(
            getSupplierFssaiNumberLabel({ fssai_number: Number.POSITIVE_INFINITY })
        ).toBeNull();
    });
});
