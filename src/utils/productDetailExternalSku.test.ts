import { describe, expect, it } from "vitest";
import { getExternalSkuLabel } from "./productDetailExternalSku";

describe("getExternalSkuLabel", () => {
    it("returns the trimmed external_sku when BE sent a non-empty string", () => {
        expect(getExternalSkuLabel({ external_sku: "AMZ-TOOR-1KG" })).toBe("AMZ-TOOR-1KG");
        expect(getExternalSkuLabel({ external_sku: "  FLIP-AATA-10  " })).toBe("FLIP-AATA-10");
    });

    it("returns null when external_sku is omitted, null, or blank", () => {
        expect(getExternalSkuLabel({})).toBeNull();
        expect(getExternalSkuLabel({ external_sku: undefined })).toBeNull();
        expect(getExternalSkuLabel({ external_sku: null })).toBeNull();
        expect(getExternalSkuLabel({ external_sku: "" })).toBeNull();
        expect(getExternalSkuLabel({ external_sku: "   " })).toBeNull();
    });

    it("does not invent external_sku from asin, barcode, or name (asin is a noop)", () => {
        expect(
            getExternalSkuLabel({
                asin: "B0DUMMYASIN1",
                barcode: "8901234567890",
                name: "Toor Dal 1kg",
            })
        ).toBeNull();
        expect(
            getExternalSkuLabel({
                asin: "B0DUMMYASIN1",
                barcode: "8901234567890",
                name: "Toor Dal 1kg",
                external_sku: null,
            })
        ).toBeNull();
    });
});
