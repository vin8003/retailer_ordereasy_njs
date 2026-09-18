import { describe, expect, it } from "vitest";
import {
    getWriteOffDetailInspectorName,
    pickWriteOffDetailFromLedgerPayload,
} from "./writeOffDetailInspectorName";

describe("getWriteOffDetailInspectorName", () => {
    it("returns the trimmed inspector_name when BE sent a non-empty string", () => {
        expect(getWriteOffDetailInspectorName({ inspector_name: "Meera" })).toBe("Meera");
        expect(getWriteOffDetailInspectorName({ inspector_name: "  Priya Shah  " })).toBe("Priya Shah");
    });

    it("returns null when inspector_name is omitted, null, or blank", () => {
        expect(getWriteOffDetailInspectorName({})).toBeNull();
        expect(getWriteOffDetailInspectorName({ inspector_name: undefined })).toBeNull();
        expect(getWriteOffDetailInspectorName({ inspector_name: null })).toBeNull();
        expect(getWriteOffDetailInspectorName({ inspector_name: "" })).toBeNull();
        expect(getWriteOffDetailInspectorName({ inspector_name: "   " })).toBeNull();
    });

    it("does not invent inspector_name from nested inspector, id, created-by, batch, or reason", () => {
        expect(
            getWriteOffDetailInspectorName({
                inspector: { name: "Hidden Inspector" },
                inspector_id: 12,
                created_by: "Ravi",
                created_by_name: "Ravi Sharma",
                batch_number: "B-104",
                reason: "damage",
                product_name: "Milk 1L",
                inspector_name: null,
            })
        ).toBeNull();
    });
});

describe("pickWriteOffDetailFromLedgerPayload", () => {
    it("returns the matching ledger row from an array payload", () => {
        const row = { id: 9, inspector_name: "Meera", reason: "damage" };
        expect(pickWriteOffDetailFromLedgerPayload([row, { id: 8 }], 9)).toEqual(row);
        expect(pickWriteOffDetailFromLedgerPayload({ results: [row] }, "9")).toEqual(row);
    });

    it("returns null when id is missing or no row matches", () => {
        expect(pickWriteOffDetailFromLedgerPayload([{ id: 9, inspector_name: "Meera" }], null)).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload([{ id: 9, inspector_name: "Meera" }], "  ")).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload([], 9)).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload({ results: [] }, 9)).toBeNull();
        expect(pickWriteOffDetailFromLedgerPayload([{ id: 8, inspector_name: "OTHER" }], 9)).toBeNull();
    });

    it("does not invent a row or inspector_name when the id is absent from the payload", () => {
        expect(
            pickWriteOffDetailFromLedgerPayload(
                [{ id: 1, inspector: { name: "Hidden Inspector" }, created_by_name: "Ravi" }],
                9
            )
        ).toBeNull();
    });
});
