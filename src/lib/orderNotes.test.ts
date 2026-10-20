import { describe, expect, it } from "vitest";
import { ORDER_NOTES_MAX, normalizeOrderNotes, orderNotesSaveError, validateOrderNotes } from "./orderNotes";

describe("order notes", () => {
    it("trims and treats null as blank", () => {
        expect(normalizeOrderNotes("  Call first  ")).toBe("Call first");
        expect(normalizeOrderNotes(null)).toBe("");
        expect(normalizeOrderNotes(undefined)).toBe("");
    });

    it("allows blank (clears) and rejects over the backend limit", () => {
        expect(validateOrderNotes("")).toBeNull();
        expect(validateOrderNotes("a".repeat(ORDER_NOTES_MAX))).toBeNull();
        expect(validateOrderNotes("a".repeat(ORDER_NOTES_MAX + 1))).toMatch(/at most 1000/);
    });

    it("maps save errors to readable text", () => {
        expect(orderNotesSaveError({ response: { status: 403, data: { error: "x" } } })).toMatch(/permission/);
        expect(orderNotesSaveError({ response: { status: 400, data: { error: "notes must be text" } } })).toBe("notes must be text");
        expect(orderNotesSaveError(new Error("Network"))).toBe("Could not save notes");
    });
});
