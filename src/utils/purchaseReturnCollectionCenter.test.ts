import { describe, expect, it } from "vitest";
import { getPurchaseReturnCollectionCenter } from "./purchaseReturnCollectionCenter";

describe("getPurchaseReturnCollectionCenter", () => {
    it("returns the collection_center text when BE sent a present non-empty value", () => {
        expect(getPurchaseReturnCollectionCenter({ collection_center: "North Hub" })).toBe(
            "North Hub"
        );
        expect(getPurchaseReturnCollectionCenter({ collection_center: "  CC-12  " })).toBe("CC-12");
        expect(getPurchaseReturnCollectionCenter({ collection_center: 7 })).toBe("7");
        expect(getPurchaseReturnCollectionCenter({ collection_center: 0 })).toBe("0");
        expect(getPurchaseReturnCollectionCenter({ collection_center: "0" })).toBe("0");
    });

    it("returns null when collection_center is omitted, null, or blank", () => {
        expect(getPurchaseReturnCollectionCenter({})).toBeNull();
        expect(getPurchaseReturnCollectionCenter({ collection_center: undefined })).toBeNull();
        expect(getPurchaseReturnCollectionCenter({ collection_center: null })).toBeNull();
        expect(getPurchaseReturnCollectionCenter({ collection_center: "" })).toBeNull();
        expect(getPurchaseReturnCollectionCenter({ collection_center: "   " })).toBeNull();
    });

    it("does not invent collection_center from notes, warehouse, or nested collection", () => {
        expect(
            getPurchaseReturnCollectionCenter({
                notes: "Damaged carton",
                warehouse: "Main Depot",
                warehouse_name: "Main Depot",
                depot: "West",
                collection_center_name: "Hidden Hub",
                collection: { name: "Nested Hub" },
                supplier_name: "ABC Foods",
                invoice_number: "INV-44",
                return_number: "RET-9",
            })
        ).toBeNull();
        expect(
            getPurchaseReturnCollectionCenter({
                notes: "Damaged carton",
                collection_center: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric collection_center", () => {
        expect(getPurchaseReturnCollectionCenter({ collection_center: Number.NaN })).toBeNull();
        expect(
            getPurchaseReturnCollectionCenter({ collection_center: Number.POSITIVE_INFINITY })
        ).toBeNull();
    });
});
