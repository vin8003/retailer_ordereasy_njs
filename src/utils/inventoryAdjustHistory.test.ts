import { describe, expect, it } from "vitest";
import { getInventoryAdjustReasonLabel } from "./inventoryAdjustHistory";

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
