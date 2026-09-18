import { describe, expect, it } from "vitest";
import { getPurchaseDetailTransporterGstin } from "./purchaseDetailTransporterGstin";

describe("getPurchaseDetailTransporterGstin", () => {
    it("returns the trimmed transporter_gstin when BE sent a non-empty string", () => {
        expect(getPurchaseDetailTransporterGstin({ transporter_gstin: "27AAPFU0939F1ZV" })).toBe(
            "27AAPFU0939F1ZV"
        );
        expect(getPurchaseDetailTransporterGstin({ transporter_gstin: "  09AAACH7409R1ZZ  " })).toBe(
            "09AAACH7409R1ZZ"
        );
    });

    it("returns null when transporter_gstin is omitted, null, or blank", () => {
        expect(getPurchaseDetailTransporterGstin({})).toBeNull();
        expect(getPurchaseDetailTransporterGstin({ transporter_gstin: undefined })).toBeNull();
        expect(getPurchaseDetailTransporterGstin({ transporter_gstin: null })).toBeNull();
        expect(getPurchaseDetailTransporterGstin({ transporter_gstin: "" })).toBeNull();
        expect(getPurchaseDetailTransporterGstin({ transporter_gstin: "   " })).toBeNull();
    });

    it("does not invent transporter_gstin from invoice_number, notes, supplier, or other transport fields", () => {
        expect(
            getPurchaseDetailTransporterGstin({
                invoice_number: "INV-44",
                notes: "Express delivery",
                supplier_name: "ABC Foods",
                gst_number: "27AAPFU0939F1ZV",
                vehicle_number: "MH12AB1234",
                transporter_name: "Blue Dart",
                transporter_id: "TR-9",
            })
        ).toBeNull();
        expect(
            getPurchaseDetailTransporterGstin({
                invoice_number: "INV-44",
                notes: "Express delivery",
                supplier_name: "ABC Foods",
                gst_number: "27AAPFU0939F1ZV",
                vehicle_number: "MH12AB1234",
                transporter_name: "Blue Dart",
                transporter_id: "TR-9",
                transporter_gstin: null,
            })
        ).toBeNull();
    });
});
