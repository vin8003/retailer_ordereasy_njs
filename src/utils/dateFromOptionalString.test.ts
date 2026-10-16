import { describe, expect, it } from "vitest";
import { dateFromOptionalString } from "./dateFromOptionalString";

describe("dateFromOptionalString", () => {
    it("builds a Date from a defined ISO string", () => {
        const iso = "2024-06-15T00:00:00.000Z";
        expect(dateFromOptionalString(iso).getTime()).toBe(Date.parse(iso));
    });

    it("returns Invalid Date when the string is omitted (does not invent today)", () => {
        const parsed = dateFromOptionalString(undefined);
        expect(Number.isNaN(parsed.getTime())).toBe(true);
    });

    it("returns Invalid Date for empty or null, matching a missing value", () => {
        expect(Number.isNaN(dateFromOptionalString("").getTime())).toBe(true);
        expect(Number.isNaN(dateFromOptionalString(null).getTime())).toBe(true);
    });
});
