import { describe, expect, it } from "vitest";
import { getSupplierGstNumber, getSupplierPaymentTerms } from "./supplierListScalars";

describe("getSupplierGstNumber", () => {
    it("returns the trimmed gst_number when BE sent a non-empty string", () => {
        expect(getSupplierGstNumber({ gst_number: "27AAPFU0939F1ZV" })).toBe("27AAPFU0939F1ZV");
        expect(getSupplierGstNumber({ gst_number: "  22AAAAA0000A1Z5  " })).toBe("22AAAAA0000A1Z5");
    });

    it("returns null when gst_number is omitted, null, or blank", () => {
        expect(getSupplierGstNumber({})).toBeNull();
        expect(getSupplierGstNumber({ gst_number: undefined })).toBeNull();
        expect(getSupplierGstNumber({ gst_number: null })).toBeNull();
        expect(getSupplierGstNumber({ gst_number: "" })).toBeNull();
        expect(getSupplierGstNumber({ gst_number: "   " })).toBeNull();
    });

    it("does not invent gst_number from company name or payment_terms", () => {
        expect(
            getSupplierGstNumber({
                company_name: "ABC Foods",
                payment_terms: "Net 30",
            })
        ).toBeNull();
        expect(
            getSupplierGstNumber({
                company_name: "ABC Foods",
                payment_terms: "Net 30",
                gst_number: null,
            })
        ).toBeNull();
    });
});

describe("getSupplierPaymentTerms", () => {
    it("returns the trimmed payment_terms when BE sent a non-empty string", () => {
        expect(getSupplierPaymentTerms({ payment_terms: "Net 30" })).toBe("Net 30");
        expect(getSupplierPaymentTerms({ payment_terms: "  COD  " })).toBe("COD");
    });

    it("returns null when payment_terms is omitted, null, or blank", () => {
        expect(getSupplierPaymentTerms({})).toBeNull();
        expect(getSupplierPaymentTerms({ payment_terms: undefined })).toBeNull();
        expect(getSupplierPaymentTerms({ payment_terms: null })).toBeNull();
        expect(getSupplierPaymentTerms({ payment_terms: "" })).toBeNull();
        expect(getSupplierPaymentTerms({ payment_terms: "   " })).toBeNull();
    });

    it("does not invent payment_terms from company name or gst_number", () => {
        expect(
            getSupplierPaymentTerms({
                company_name: "ABC Foods",
                gst_number: "27AAPFU0939F1ZV",
            })
        ).toBeNull();
        expect(
            getSupplierPaymentTerms({
                company_name: "ABC Foods",
                gst_number: "27AAPFU0939F1ZV",
                payment_terms: null,
            })
        ).toBeNull();
    });
});
