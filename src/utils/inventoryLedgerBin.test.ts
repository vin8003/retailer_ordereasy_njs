import { describe, expect, it } from "vitest";
import { getInventoryLedgerBinCodeLabel } from "./inventoryLedgerBin";

describe("getInventoryLedgerBinCodeLabel", () => {
    it("returns the bin_code text when BE sent a present non-empty value", () => {
        expect(getInventoryLedgerBinCodeLabel({ bin_code: "A-12" })).toBe("A-12");
        expect(getInventoryLedgerBinCodeLabel({ bin_code: "88" })).toBe("88");
        expect(getInventoryLedgerBinCodeLabel({ bin_code: "  B1  " })).toBe("B1");
        expect(getInventoryLedgerBinCodeLabel({ bin_code: 0 })).toBe("0");
        expect(getInventoryLedgerBinCodeLabel({ bin_code: "0" })).toBe("0");
    });

    it("returns null when bin_code is omitted, null, or blank", () => {
        expect(getInventoryLedgerBinCodeLabel({})).toBeNull();
        expect(getInventoryLedgerBinCodeLabel({ bin_code: undefined })).toBeNull();
        expect(getInventoryLedgerBinCodeLabel({ bin_code: null })).toBeNull();
        expect(getInventoryLedgerBinCodeLabel({ bin_code: "" })).toBeNull();
        expect(getInventoryLedgerBinCodeLabel({ bin_code: "   " })).toBeNull();
    });

    it("does not invent bin_code from row id, product_id, batch_id, bin, or nested bin", () => {
        expect(
            getInventoryLedgerBinCodeLabel({
                id: 99,
                product_id: 12,
                batch_id: 42,
                bin: "SHELF-9",
                location: "WH-1",
                bin_code: null,
            })
        ).toBeNull();
        expect(
            getInventoryLedgerBinCodeLabel({
                bin: { code: "NESTED", id: 7 },
                bin_code: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric bin_code", () => {
        expect(getInventoryLedgerBinCodeLabel({ bin_code: Number.NaN })).toBeNull();
        expect(getInventoryLedgerBinCodeLabel({ bin_code: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
