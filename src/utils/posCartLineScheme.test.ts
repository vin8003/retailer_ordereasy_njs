import { describe, expect, it } from "vitest";
import { pickPosCartLineSchemeName } from "./posCartLineScheme";

describe("pickPosCartLineSchemeName", () => {
    it("returns the trimmed scheme_name when BE sent a non-empty string", () => {
        expect(pickPosCartLineSchemeName({ scheme_name: "Buy 1 Get 1" })).toBe("Buy 1 Get 1");
        expect(pickPosCartLineSchemeName({ scheme_name: "  Festival Offer  " })).toBe("Festival Offer");
    });

    it("returns null when scheme_name is omitted, null, or blank", () => {
        expect(pickPosCartLineSchemeName({})).toBeNull();
        expect(pickPosCartLineSchemeName({ scheme_name: undefined })).toBeNull();
        expect(pickPosCartLineSchemeName({ scheme_name: null })).toBeNull();
        expect(pickPosCartLineSchemeName({ scheme_name: "" })).toBeNull();
        expect(pickPosCartLineSchemeName({ scheme_name: "   " })).toBeNull();
    });

    it("does not invent scheme_name from nested scheme, scheme_id, offer_name, brand, or item name", () => {
        expect(
            pickPosCartLineSchemeName({
                name: "Full Cream Milk",
                brand_name: "Amul",
                offer_name: "Hidden Offer",
                scheme_id: 77,
                scheme: { name: "Hidden Scheme" },
            })
        ).toBeNull();
        expect(
            pickPosCartLineSchemeName({
                scheme: { name: "Hidden Scheme" },
                scheme_name: null,
            })
        ).toBeNull();
    });
});
