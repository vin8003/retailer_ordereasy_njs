import { describe, expect, it } from "vitest";
import { getStockTransferGodownName, mapStockTransferListItem } from "./stockTransferGodown";

describe("getStockTransferGodownName", () => {
    it("returns the trimmed godown_name when BE sent a non-empty string", () => {
        expect(getStockTransferGodownName({ godown_name: "Main Godown" })).toBe("Main Godown");
        expect(getStockTransferGodownName({ godown_name: "  Shop 2  " })).toBe("Shop 2");
    });

    it("returns null when godown_name is omitted, null, or blank", () => {
        expect(getStockTransferGodownName({})).toBeNull();
        expect(getStockTransferGodownName({ godown_name: undefined })).toBeNull();
        expect(getStockTransferGodownName({ godown_name: null })).toBeNull();
        expect(getStockTransferGodownName({ godown_name: "" })).toBeNull();
        expect(getStockTransferGodownName({ godown_name: "   " })).toBeNull();
    });

    it("does not invent godown_name from nested godown, ids, or other location fields", () => {
        expect(
            getStockTransferGodownName({
                godown: { id: 7, name: "Nested Store" },
                godown_id: 7,
                location_name: "Front Shop",
                warehouse_name: "WH-A",
                from_godown_name: "From A",
                to_godown_name: "To B",
            })
        ).toBeNull();
        expect(
            getStockTransferGodownName({
                godown: { id: 7, name: "Nested Store" },
                godown_id: 7,
                location_name: "Front Shop",
                warehouse_name: "WH-A",
                from_godown_name: "From A",
                to_godown_name: "To B",
                godown_name: null,
            })
        ).toBeNull();
    });
});

describe("mapStockTransferListItem", () => {
    it("passes through optional godown_name without inventing from other fields", () => {
        expect(
            mapStockTransferListItem({
                id: 9,
                product_name: "Atta 10kg",
                quantity: 4,
                status: "in_transit",
                godown_name: "  Main Godown  ",
            })
        ).toEqual({
            id: 9,
            product_name: "Atta 10kg",
            quantity: 4,
            status: "in_transit",
            created_at: undefined,
            godown_name: "  Main Godown  ",
        });
        expect(
            mapStockTransferListItem({
                id: 10,
                product_name: "Rice 5kg",
                status: "received",
                from_godown_name: "From A",
                godown_name: null,
            }).godown_name
        ).toBeNull();
        expect(
            mapStockTransferListItem({
                id: 11,
                product_name: "Oil 1L",
                godown: { name: "Nested Store" },
            }).godown_name
        ).toBeUndefined();
    });
});
