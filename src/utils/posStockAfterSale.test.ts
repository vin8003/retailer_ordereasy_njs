import { describe, expect, it } from "vitest";
import { applySaleToProducts } from "./posStockAfterSale";

const rice = { id: 1, quantity: 10, saleable_quantity: 8, track_inventory: true };
const salt = { id: 2, quantity: 5, track_inventory: true };

describe("applySaleToProducts", () => {
    it("takes the sold quantity off gross and saleable stock", () => {
        const [next, other] = applySaleToProducts([rice, salt], [{ id: 1, cart_quantity: 3 }]);
        expect(next).toMatchObject({ quantity: 7, saleable_quantity: 5 });
        expect(other).toBe(salt);
    });

    it("adds up several lines of one product and reads text quantities", () => {
        const [next] = applySaleToProducts(
            [{ ...rice, quantity: "10.5", saleable_quantity: null }],
            [{ id: 1, cart_quantity: "0.25" }, { id: 1, cart_quantity: 1.1 }]
        );
        expect(next.quantity).toBe(9.15);
        expect(next.saleable_quantity).toBeNull();
    });

    it("lets stock go below zero for an oversold bill", () => {
        const [, next] = applySaleToProducts([rice, salt], [{ id: 2, cart_quantity: 7 }]);
        expect(next.quantity).toBe(-2);
    });

    it("takes batch lines off their own batch and the product", () => {
        const product = {
            id: 3,
            quantity: 9,
            track_inventory: true,
            batches: [{ id: 30, quantity: 4 }, { id: 31, quantity: "5" }],
        };
        const [next] = applySaleToProducts([product], [
            { id: 3, batch_id: 31, cart_quantity: 2 },
            { id: 3, batch_id: 31, cart_quantity: 1 },
        ]);
        expect(next.quantity).toBe(6);
        expect(next.batches).toEqual([{ id: 30, quantity: 4 }, { id: 31, quantity: 2 }]);
        expect(next.batches?.[0]).toBe(product.batches[0]);
    });

    it("leaves untracked products, empty and zero lines alone", () => {
        const loose = { id: 4, quantity: 0, track_inventory: false };
        const products = [rice, loose];
        expect(applySaleToProducts(products, [])).toBe(products);
        const after = applySaleToProducts(products, [
            { id: 4, cart_quantity: 2 },
            { id: 1, cart_quantity: 0 },
            { id: 1, cart_quantity: 1, track_inventory: false },
        ]);
        expect(after[0]).toBe(rice);
        expect(after[1]).toBe(loose);
    });

    it("ignores lines for products no longer in the list", () => {
        const [next] = applySaleToProducts([rice], [{ id: 99, cart_quantity: 1 }]);
        expect(next).toBe(rice);
    });
});
