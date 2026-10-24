import { describe, expect, it } from "vitest";
import { IN_VIEW_MS, pickDetectedCode } from "./scanPick";

describe("pickDetectedCode", () => {
    it("returns null before anything was read", () => {
        expect(pickDetectedCode(null, 1000)).toBeNull();
    });
    it("returns the code while it is still in view", () => {
        expect(pickDetectedCode({ code: "8901", at: 1000 }, 1000 + IN_VIEW_MS)).toBe("8901");
    });
    it("drops a code that left the view", () => {
        expect(pickDetectedCode({ code: "8901", at: 1000 }, 1001 + IN_VIEW_MS)).toBeNull();
    });
});
