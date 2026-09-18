import { describe, expect, it } from "vitest";
import { getPriorityFlagLabel } from "./priorityFlag";

describe("getPriorityFlagLabel", () => {
    it("returns Priority when BE sent priority_flag true", () => {
        expect(getPriorityFlagLabel({ priority_flag: true })).toBe("Priority");
    });

    it("returns null when priority_flag is false, absent, or null", () => {
        expect(getPriorityFlagLabel({})).toBeNull();
        expect(getPriorityFlagLabel({ priority_flag: undefined })).toBeNull();
        expect(getPriorityFlagLabel({ priority_flag: null })).toBeNull();
        expect(getPriorityFlagLabel({ priority_flag: false })).toBeNull();
    });

    it("does not invent Priority from sibling fields or non-boolean values", () => {
        expect(
            getPriorityFlagLabel({
                priority: true,
                is_priority: true,
                urgent: true,
                high_priority: true,
            } as { priority_flag?: boolean | null })
        ).toBeNull();
        expect(getPriorityFlagLabel({ priority_flag: "true" as unknown as boolean })).toBeNull();
        expect(getPriorityFlagLabel({ priority_flag: 1 as unknown as boolean })).toBeNull();
    });
});
