import { describe, expect, it } from "vitest";
import {
    getWriteOffDetailBatchNumber,
    pickWriteOffDetailFromLedgerPayload,
} from "./writeOffDetailBatchNumber";

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

describe("pickWriteOffDetailFromLedgerPayload", () => {
    it("returns the matching ledger row from an array payload", () => {
        const row = { id: 9, batch_number: "B-104", reason: "damage" };
        expect(pickWriteOffDetailFromLedgerPayload([row, { id: 8 }], 9)).toEqual(row);
        expect(pickWriteOffDetailFromLedgerPayload({ results: [row] }, "9")).toEqual(row);
    });

    it("returns null when id is missing or no row matches", () => {
        expect(pickWriteOffDetailFromLedgerPayload([{ id: 9, batch_number: "B-104" }], null)).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload([{ id: 9, batch_number: "B-104" }], "  ")).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload([], 9)).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload({ results: [] }, 9)).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload([{ id: 8, batch_number: "OTHER" }], 9)).toBeNull();
    });

    it("does not invent a row or batch_number when the id is absent from the payload", () => {
        expect(
            pickWriteOffDetailFromLedgerPayload(
                [{ id: 1, batch_id: 77, batch: { batch_number: "NESTED-B1" } }],
                9
            )
        ).toBeNull();
    });
});
