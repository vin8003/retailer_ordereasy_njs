import { describe, expect, it } from "vitest";
import { getWriteOffDetailCostCenter } from "./writeOffDetailCostCenter";

describe("getWriteOffDetailCostCenter", () => {
    it("returns the trimmed cost_center when BE sent a non-empty string", () => {
        expect(getWriteOffDetailCostCenter({ cost_center: "CC-STORE" })).toBe("CC-STORE");
        expect(getWriteOffDetailCostCenter({ cost_center: "  WH-1  " })).toBe("WH-1");
    });

    it("returns a finite numeric cost_center as text, including 0", () => {
        expect(getWriteOffDetailCostCenter({ cost_center: 12 })).toBe("12");
        expect(getWriteOffDetailCostCenter({ cost_center: 0 })).toBe("0");
    });

    it("returns null when cost_center is omitted, null, or blank", () => {
        expect(getWriteOffDetailCostCenter({})).toBeNull();
        expect(getWriteOffDetailCostCenter({ cost_center: undefined })).toBeNull();
        expect(getWriteOffDetailCostCenter({ cost_center: null })).toBeNull();
        expect(getWriteOffDetailCostCenter({ cost_center: "" })).toBeNull();
        expect(getWriteOffDetailCostCenter({ cost_center: "   " })).toBeNull();
    });

    it("returns null for non-finite numeric cost_center", () => {
        expect(getWriteOffDetailCostCenter({ cost_center: Number.NaN })).toBeNull();
        expect(getWriteOffDetailCostCenter({ cost_center: Number.POSITIVE_INFINITY })).toBeNull();
    });

    it("does not invent cost_center from aliases, nested objects, reason, or ids", () => {
        expect(
            getWriteOffDetailCostCenter({
                id: 9,
                product_id: 44,
                reason: "damage",
                department: "Warehouse",
                cost_centre: "CC-UK",
                costCenter: "CC-CAMEL",
                cost_center_name: "Store desk",
                cost_center_id: 55,
                gl_code: "GL-400",
                cost_center_obj: { id: 3, name: "Nested CC" },
                created_by: "Ravi",
            })
        ).toBeNull();
        expect(
            getWriteOffDetailCostCenter({
                id: 9,
                department: "Warehouse",
                cost_centre: "CC-UK",
                cost_center_name: "Store desk",
                cost_center: null,
            })
        ).toBeNull();
    });
});
