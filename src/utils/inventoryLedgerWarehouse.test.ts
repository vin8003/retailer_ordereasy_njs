import { describe, expect, it } from "vitest";
import { getInventoryLedgerWarehouseNameLabel } from "./inventoryLedgerWarehouse";

describe("getInventoryLedgerWarehouseNameLabel", () => {
    it("returns the trimmed warehouse_name when BE sent a non-empty string", () => {
        expect(getInventoryLedgerWarehouseNameLabel({ warehouse_name: "Main Store" })).toBe(
            "Main Store"
        );
        expect(getInventoryLedgerWarehouseNameLabel({ warehouse_name: "  Godown-2  " })).toBe(
            "Godown-2"
        );
    });

    it("returns null when warehouse_name is omitted, null, or blank", () => {
        expect(getInventoryLedgerWarehouseNameLabel({})).toBeNull();
        expect(getInventoryLedgerWarehouseNameLabel({ warehouse_name: undefined })).toBeNull();
        expect(getInventoryLedgerWarehouseNameLabel({ warehouse_name: null })).toBeNull();
        expect(getInventoryLedgerWarehouseNameLabel({ warehouse_name: "" })).toBeNull();
        expect(getInventoryLedgerWarehouseNameLabel({ warehouse_name: "   " })).toBeNull();
    });

    it("does not invent warehouse_name from warehouse_id, nested warehouse, location, or reason", () => {
        expect(
            getInventoryLedgerWarehouseNameLabel({
                warehouse_id: 7,
                warehouse: { name: "Hidden WH" },
                location: "Aisle 3",
                reason: "Main Store transfer",
                warehouse_name: null,
            })
        ).toBeNull();
    });
});
