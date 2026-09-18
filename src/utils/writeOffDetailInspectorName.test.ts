import { describe, expect, it } from "vitest";
import { getWriteOffDetailInspectorName } from "./writeOffDetailInspectorName";

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
