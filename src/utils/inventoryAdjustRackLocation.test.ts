import { describe, expect, it } from "vitest";
import { getInventoryAdjustRackLocationLabel } from "./inventoryAdjustRackLocation";

describe("getInventoryAdjustRackLocationLabel", () => {
    it("returns the rack_location text when BE sent a present non-empty value", () => {
        expect(getInventoryAdjustRackLocationLabel({ rack_location: "A-12" })).toBe("A-12");
        expect(getInventoryAdjustRackLocationLabel({ rack_location: "  R3  " })).toBe("R3");
        expect(getInventoryAdjustRackLocationLabel({ rack_location: 7 })).toBe("7");
        expect(getInventoryAdjustRackLocationLabel({ rack_location: 0 })).toBe("0");
        expect(getInventoryAdjustRackLocationLabel({ rack_location: "0" })).toBe("0");
    });

    it("returns null when rack_location is omitted, null, or blank", () => {
        expect(getInventoryAdjustRackLocationLabel({})).toBeNull();
        expect(getInventoryAdjustRackLocationLabel({ rack_location: undefined })).toBeNull();
        expect(getInventoryAdjustRackLocationLabel({ rack_location: null })).toBeNull();
        expect(getInventoryAdjustRackLocationLabel({ rack_location: "" })).toBeNull();
        expect(getInventoryAdjustRackLocationLabel({ rack_location: "   " })).toBeNull();
    });

    it("does not invent rack_location from rack, bin, location, warehouse, reason, or batch", () => {
        expect(
            getInventoryAdjustRackLocationLabel({
                rack: "A-12",
                bin: "B1",
                location: "Front",
                warehouse_name: "Main",
                warehouse_id: 3,
                warehouse: { name: "Main", rack_location: "WH-A" },
                reason: "Moved to A-12",
                batch_id: 42,
                rack_location: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric rack_location", () => {
        expect(getInventoryAdjustRackLocationLabel({ rack_location: Number.NaN })).toBeNull();
        expect(getInventoryAdjustRackLocationLabel({ rack_location: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
