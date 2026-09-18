import { describe, expect, it } from "vitest";
import { getOrderBeatNameLabel } from "./orderListBeatName";

describe("getOrderBeatNameLabel", () => {
    it("returns the trimmed beat_name when BE sent a non-empty string", () => {
        expect(getOrderBeatNameLabel({ beat_name: "Najafgarh" })).toBe("Najafgarh");
        expect(getOrderBeatNameLabel({ beat_name: "Sector 18" })).toBe("Sector 18");
        expect(getOrderBeatNameLabel({ beat_name: "  South Beat  " })).toBe("South Beat");
    });

    it("returns null when beat_name is omitted, null, or blank", () => {
        expect(getOrderBeatNameLabel({})).toBeNull();
        expect(getOrderBeatNameLabel({ beat_name: undefined })).toBeNull();
        expect(getOrderBeatNameLabel({ beat_name: null })).toBeNull();
        expect(getOrderBeatNameLabel({ beat_name: "" })).toBeNull();
        expect(getOrderBeatNameLabel({ beat_name: "   " })).toBeNull();
    });

    it("does not invent beat_name from nested beat, beat_id, or route fields", () => {
        expect(
            getOrderBeatNameLabel({
                beat: { name: "Hidden Beat" },
                beat_id: 12,
                route_name: "Route A",
                route: "R1",
                area: "South",
                beat_name: null,
            })
        ).toBeNull();
        expect(
            getOrderBeatNameLabel({
                beat: { name: "Hidden Beat" },
                beat_id: 12,
                route_name: "Route A",
            })
        ).toBeNull();
    });

    it("returns null for non-string present values", () => {
        expect(
            getOrderBeatNameLabel({
                beat_name: 0 as unknown as string,
            })
        ).toBeNull();
    });
});
