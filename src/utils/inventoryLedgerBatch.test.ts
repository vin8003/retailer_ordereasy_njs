import { describe, expect, it } from "vitest";
import { getInventoryLedgerBatchIdLabel } from "./inventoryLedgerBatch";

describe("getInventoryLedgerBatchIdLabel", () => {
    it("returns the batch_id text when BE sent a present non-empty value", () => {
        expect(getInventoryLedgerBatchIdLabel({ batch_id: 42 })).toBe("42");
        expect(getInventoryLedgerBatchIdLabel({ batch_id: "88" })).toBe("88");
        expect(getInventoryLedgerBatchIdLabel({ batch_id: "  7  " })).toBe("7");
        expect(getInventoryLedgerBatchIdLabel({ batch_id: 0 })).toBe("0");
        expect(getInventoryLedgerBatchIdLabel({ batch_id: "0" })).toBe("0");
    });

    it("returns null when batch_id is omitted, null, or blank", () => {
        expect(getInventoryLedgerBatchIdLabel({})).toBeNull();
        expect(getInventoryLedgerBatchIdLabel({ batch_id: undefined })).toBeNull();
        expect(getInventoryLedgerBatchIdLabel({ batch_id: null })).toBeNull();
        expect(getInventoryLedgerBatchIdLabel({ batch_id: "" })).toBeNull();
        expect(getInventoryLedgerBatchIdLabel({ batch_id: "   " })).toBeNull();
    });

    it("does not invent batch_id from row id, product_id, batch_number, or nested batch", () => {
        expect(
            getInventoryLedgerBatchIdLabel({
                id: 99,
                product_id: 12,
                batch_number: "LOT-A",
                batch: { id: 55 },
                batch_id: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric batch_id", () => {
        expect(getInventoryLedgerBatchIdLabel({ batch_id: Number.NaN })).toBeNull();
        expect(getInventoryLedgerBatchIdLabel({ batch_id: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
