import { describe, expect, it } from "vitest";
import { addOrBumpRow, mergeSuggestions } from "./purchaseRows";

const row = (id: number, quantity = 1, purchase_price = 10) => ({
    product: { id },
    quantity,
    purchase_price,
    total: quantity * purchase_price,
});

describe("addOrBumpRow", () => {
    it("puts a new product first", () => {
        const rows = addOrBumpRow([row(1), row(2)], 3, () => row(3));
        expect(rows.map((r) => r.product.id)).toEqual([3, 1, 2]);
    });

    it("moves a product added again to the top and counts it once more", () => {
        const rows = addOrBumpRow([row(1), row(2, 2, 5), row(3)], 2, () => row(2));
        expect(rows.map((r) => r.product.id)).toEqual([2, 1, 3]);
        expect(rows[0].quantity).toBe(3);
        expect(rows[0].total).toBe(15);
    });

    it("does not change the rows it was given", () => {
        const original = [row(1), row(2)];
        addOrBumpRow(original, 2, () => row(2));
        expect(original.map((r) => r.quantity)).toEqual([1, 1]);
    });
});

describe("mergeSuggestions", () => {
    it("keeps the search order and adds cached products it did not return", () => {
        expect(mergeSuggestions([{ id: 3 }, { id: 1 }], [{ id: 1 }, { id: 2 }]).map((p) => p.id)).toEqual([3, 1, 2]);
    });
});
