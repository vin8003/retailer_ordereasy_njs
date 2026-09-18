import { describe, expect, it } from "vitest";
import { getSupplierPanNumber } from "./supplierDetailPan";

describe("getSupplierPanNumber", () => {
    it("returns the trimmed pan_number when BE sent a non-empty string", () => {
        expect(getSupplierPanNumber({ pan_number: "ABCDE1234F" })).toBe("ABCDE1234F");
        expect(getSupplierPanNumber({ pan_number: "  AAAPA1234A  " })).toBe("AAAPA1234A");
    });

    it("returns null when pan_number is omitted, null, or blank", () => {
        expect(getSupplierPanNumber({})).toBeNull();
        expect(getSupplierPanNumber({ pan_number: undefined })).toBeNull();
        expect(getSupplierPanNumber({ pan_number: null })).toBeNull();
        expect(getSupplierPanNumber({ pan_number: "" })).toBeNull();
        expect(getSupplierPanNumber({ pan_number: "   " })).toBeNull();
    });

    it("does not invent pan_number from company name, gst_number, or payment_terms", () => {
        expect(
            getSupplierPanNumber({
                company_name: "ABC Foods",
                gst_number: "27AAPFU0939F1ZV",
                payment_terms: "Net 30",
            })
        ).toBeNull();
        expect(
            getSupplierPanNumber({
                company_name: "ABC Foods",
                gst_number: "27AAPFU0939F1ZV",
                payment_terms: "Net 30",
                pan_number: null,
            })
        ).toBeNull();
    });
});
