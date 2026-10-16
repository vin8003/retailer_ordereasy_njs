import { describe, expect, it } from "vitest";
import { pickPosCartLineBrandName } from "./posCartLineBrand";

describe("pickPosCartLineBrandName", () => {
    it("returns the trimmed brand_name when BE sent a non-empty string", () => {
        expect(pickPosCartLineBrandName({ brand_name: "Amul" })).toBe("Amul");
        expect(pickPosCartLineBrandName({ brand_name: "  Nestle  " })).toBe("Nestle");
    });

    it("returns null when brand_name is omitted, null, or blank", () => {
        expect(pickPosCartLineBrandName({})).toBeNull();
        expect(pickPosCartLineBrandName({ brand_name: undefined })).toBeNull();
        expect(pickPosCartLineBrandName({ brand_name: null })).toBeNull();
        expect(pickPosCartLineBrandName({ brand_name: "" })).toBeNull();
        expect(pickPosCartLineBrandName({ brand_name: "   " })).toBeNull();
    });

    it("does not invent brand_name from a nested brand object or the item name", () => {
        expect(
            pickPosCartLineBrandName({
                name: "Full Cream Milk",
                brand: { name: "Hidden Brand" },
            })
        ).toBeNull();
        expect(
            pickPosCartLineBrandName({
                brand: { name: "Hidden Brand" },
                brand_name: null,
            })
        ).toBeNull();
    });
});
