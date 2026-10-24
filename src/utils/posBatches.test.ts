import { describe, expect, it } from "vitest";
import { getBatchMrp, isSellableBatch, pickPosBatch } from "./posBatches";

const fresh = { id: 2, batch_number: "PAN-NEW", barcode: "B-NEW", is_active: true, is_expired: false };
const old = { id: 3, batch_number: "PAN-OLD", barcode: "B-OLD", is_active: true, is_expired: true };

describe("isSellableBatch", () => {
    it("rejects expired and inactive batches", () => {
        expect(isSellableBatch(fresh)).toBe(true);
        expect(isSellableBatch(old)).toBe(false);
        expect(isSellableBatch({ ...fresh, is_active: false })).toBe(false);
    });

    it("treats a batch without the flags as sellable", () => {
        expect(isSellableBatch({})).toBe(true);
    });
});

describe("pickPosBatch", () => {
    it("adds the only fresh batch directly when the other one has expired", () => {
        expect(pickPosBatch([fresh, old])).toEqual({ kind: "batch", batch: fresh });
    });

    it("opens the picker when several batches can be sold", () => {
        expect(pickPosBatch([fresh, { ...fresh, id: 4, batch_number: "PAN-NEW-2" }])).toEqual({ kind: "choose" });
    });

    it("refuses a scan of the expired lot's own barcode", () => {
        expect(pickPosBatch([fresh, old], "B-OLD", "890")).toEqual({ kind: "expired", batch: old });
    });

    it("sells a fresh lot when the scanned product barcode is shared with an expired lot", () => {
        const sharedOld = { ...old, barcode: "890" };
        const unlabelledFresh = { ...fresh, barcode: null };
        expect(pickPosBatch([unlabelledFresh, sharedOld], "890", "890")).toEqual({
            kind: "batch",
            batch: unlabelledFresh,
        });
    });

    it("finds nothing to sell when every batch has expired", () => {
        expect(pickPosBatch([old])).toEqual({ kind: "none" });
        expect(pickPosBatch([old], "890", "890")).toEqual({ kind: "none" });
    });
});

describe("getBatchMrp", () => {
    it("returns the batch MRP when present", () => {
        expect(getBatchMrp({ original_price: "95.00" })).toBe(95);
        expect(getBatchMrp({ original_price: 95 })).toBe(95);
    });

    it("returns null instead of NaN when the batch has no MRP", () => {
        expect(getBatchMrp({ original_price: null })).toBeNull();
        expect(getBatchMrp({})).toBeNull();
        expect(getBatchMrp({ original_price: "" })).toBeNull();
        expect(getBatchMrp({ original_price: "abc" })).toBeNull();
    });
});
