import { describe, expect, it } from "vitest";
import { getOrderDetailNotes } from "./orderDetailNotes";

describe("getOrderDetailNotes", () => {
    it("returns the trimmed notes when BE sent a non-empty string", () => {
        expect(getOrderDetailNotes({ notes: "Leave at the back gate" })).toBe("Leave at the back gate");
        expect(getOrderDetailNotes({ notes: "  COD leftover  " })).toBe("COD leftover");
    });

    it("returns null when notes is omitted, null, or blank", () => {
        expect(getOrderDetailNotes({})).toBeNull();
        expect(getOrderDetailNotes({ notes: undefined })).toBeNull();
        expect(getOrderDetailNotes({ notes: null })).toBeNull();
        expect(getOrderDetailNotes({ notes: "" })).toBeNull();
        expect(getOrderDetailNotes({ notes: "   " })).toBeNull();
    });

    it("does not invent notes from special_instructions, remark, feedback, or order_number", () => {
        expect(
            getOrderDetailNotes({
                special_instructions: "Ring the bell",
                remark: "VIP",
                feedback: { comment: "Great shop" },
                order_number: "OE-1001",
            })
        ).toBeNull();
        expect(
            getOrderDetailNotes({
                special_instructions: "Ring the bell",
                remark: "VIP",
                feedback: { comment: "Great shop" },
                order_number: "OE-1001",
                notes: null,
            })
        ).toBeNull();
    });
});
