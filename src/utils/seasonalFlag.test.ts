import { describe, expect, it } from "vitest";
import { getSeasonalLabel } from "./seasonalFlag";

describe("getSeasonalLabel", () => {
    it("returns Seasonal when BE sent is_seasonal true", () => {
        expect(getSeasonalLabel({ is_seasonal: true })).toBe("Seasonal");
    });

    it("returns null when is_seasonal is false, absent, or null", () => {
        expect(getSeasonalLabel({})).toBeNull();
        expect(getSeasonalLabel({ is_seasonal: undefined })).toBeNull();
        expect(getSeasonalLabel({ is_seasonal: null })).toBeNull();
        expect(getSeasonalLabel({ is_seasonal: false })).toBeNull();
    });
});
