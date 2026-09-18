import { describe, expect, it } from "vitest";
import {
    getInventoryAdjustNoteLabel,
    getInventoryAdjustReasonLabel,
} from "./inventoryAdjustHistory";

describe("getInventoryAdjustReasonLabel", () => {
    it("returns the trimmed reason when BE sent a non-empty string", () => {
        expect(getInventoryAdjustReasonLabel({ reason: "Count correction" })).toBe(
            "Count correction"
        );
        expect(getInventoryAdjustReasonLabel({ reason: "  Damaged case  " })).toBe(
            "Damaged case"
        );
    });

    it("returns null when reason is omitted, null, or blank", () => {
        expect(getInventoryAdjustReasonLabel({})).toBeNull();
        expect(getInventoryAdjustReasonLabel({ reason: undefined })).toBeNull();
        expect(getInventoryAdjustReasonLabel({ reason: null })).toBeNull();
        expect(getInventoryAdjustReasonLabel({ reason: "" })).toBeNull();
        expect(getInventoryAdjustReasonLabel({ reason: "   " })).toBeNull();
    });

    it("does not invent reason from note, notes, log_type, or created_by", () => {
        expect(
            getInventoryAdjustReasonLabel({
                note: "Shelf 3 recount",
                notes: "Internal memo",
                log_type: "removed",
                created_by: "Asha",
                quantity_change: -2,
                reason: null,
            })
        ).toBeNull();
    });
});

describe("getInventoryAdjustNoteLabel", () => {
    it("returns the trimmed note when BE sent a non-empty string", () => {
        expect(getInventoryAdjustNoteLabel({ note: "Shelf 3 recount" })).toBe(
            "Shelf 3 recount"
        );
        expect(getInventoryAdjustNoteLabel({ note: "  Found 2 extra  " })).toBe(
            "Found 2 extra"
        );
    });

    it("returns null when note is omitted, null, or blank", () => {
        expect(getInventoryAdjustNoteLabel({})).toBeNull();
        expect(getInventoryAdjustNoteLabel({ note: undefined })).toBeNull();
        expect(getInventoryAdjustNoteLabel({ note: null })).toBeNull();
        expect(getInventoryAdjustNoteLabel({ note: "" })).toBeNull();
        expect(getInventoryAdjustNoteLabel({ note: "   " })).toBeNull();
    });

    it("does not invent note from reason, notes, log_type, or created_by", () => {
        expect(
            getInventoryAdjustNoteLabel({
                reason: "Count correction",
                notes: "Internal memo",
                log_type: "added",
                created_by: "Asha",
                quantity_change: 4,
                note: null,
            })
        ).toBeNull();
    });
});
