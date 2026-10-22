import { describe, expect, it } from "vitest";
import { addedLinePrice, discountAmountToSave, extraOrderDiscount, offerSavingsInLines } from "./orderEditDiscount";

// Atta at a ₹14 app offer (list 280, sold 266) and dal at list price, as BE returns them.
const atta = { product_price: "280.00", quantity: "1.000", total_price: "266.00" };
const dal = { product_price: "150.00", quantity: "1.000", total_price: "150.00" };

describe("offerSavingsInLines", () => {
    it("adds up the offer savings already inside the line prices", () => {
        expect(offerSavingsInLines([atta, dal])).toBe(14);
        expect(offerSavingsInLines([{ ...atta, quantity: 2, total_price: 532 }])).toBe(28);
    });

    it("ignores lines priced above list and lines without a list price", () => {
        expect(offerSavingsInLines([{ ...dal, total_price: "160.00" }])).toBe(0);
        expect(offerSavingsInLines([{ ...atta, product_price: null }, dal])).toBe(0);
    });
});

describe("extraOrderDiscount", () => {
    it("shows no extra discount when the order discount is only the app offer", () => {
        expect(extraOrderDiscount("14.00", 14)).toBe(0);
    });

    it("keeps a manual discount given on top of the offer", () => {
        expect(extraOrderDiscount("34.00", 14)).toBe(20);
    });

    it("keeps the whole discount on an order without offer lines", () => {
        expect(extraOrderDiscount("10.00", 0)).toBe(10);
        expect(extraOrderDiscount(null, 0)).toBe(0);
    });
});

describe("discountAmountToSave", () => {
    it("sends the offer savings back with the extra discount, so BE subtracts only the extra", () => {
        expect(discountAmountToSave(14, 0)).toBe(14);
        expect(discountAmountToSave(14, 20)).toBe(34);
    });

    it("never sends a negative extra discount", () => {
        expect(discountAmountToSave(14, -5)).toBe(14);
    });
});

describe("addedLinePrice", () => {
    it("prices a line added to an app order at the app price", () => {
        expect(addedLinePrice({ price: "30.00", app_price: "28.00" }, "app")).toBe(28);
    });

    it("uses the store price for shop orders and when no app price is set", () => {
        expect(addedLinePrice({ price: "30.00", app_price: "28.00" }, "pos")).toBe(30);
        expect(addedLinePrice({ price: "30.00", app_price: null }, "app")).toBe(30);
    });
});
