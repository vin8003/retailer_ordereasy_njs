import { describe, expect, it } from "vitest";
import { getWriteOffDetailBatchNumber } from "./writeOffDetailBatchNumber";

describe("getWriteOffDetailBatchNumber", () => {
    it("returns the trimmed batch_number when BE sent a non-empty string", () => {
        expect(getWriteOffDetailBatchNumber({ batch_number: "B-104" })).toBe("B-104");
        expect(getWriteOffDetailBatchNumber({ batch_number: "  LOT-9  " })).toBe("LOT-9");
    });

    it("returns a finite numeric batch_number as text, including 0", () => {
        expect(getWriteOffDetailBatchNumber({ batch_number: 12 })).toBe("12");
        expect(getWriteOffDetailBatchNumber({ batch_number: 0 })).toBe("0");
    });

    it("returns null when batch_number is omitted, null, or blank", () => {
        expect(getWriteOffDetailBatchNumber({})).toBeNull();
        expect(getWriteOffDetailBatchNumber({ batch_number: undefined })).toBeNull();
        expect(getWriteOffDetailBatchNumber({ batch_number: null })).toBeNull();
        expect(getWriteOffDetailBatchNumber({ batch_number: "" })).toBeNull();
        expect(getWriteOffDetailBatchNumber({ batch_number: "   " })).toBeNull();
    });

    it("returns null for non-finite numeric batch_number", () => {
        expect(getWriteOffDetailBatchNumber({ batch_number: Number.NaN })).toBeNull();
        expect(getWriteOffDetailBatchNumber({ batch_number: Number.POSITIVE_INFINITY })).toBeNull();
    });

    it("does not invent batch_number from batch_id, nested batch, reason, or created-by", () => {
        expect(
            getWriteOffDetailBatchNumber({
                batch_id: 77,
                batch: { batch_number: "NESTED-B1" },
                reason: "damage",
                product_name: "Milk 1L",
                created_by: "Ravi",
                created_by_name: "Ravi Sharma",
            })
        ).toBeNull();
        expect(
            getWriteOffDetailBatchNumber({
                batch_id: 77,
                batch: { batch_number: "NESTED-B1" },
                reason: "damage",
                product_name: "Milk 1L",
                created_by: "Ravi",
                created_by_name: "Ravi Sharma",
                batch_number: null,
            })
        ).toBeNull();
    });
});
