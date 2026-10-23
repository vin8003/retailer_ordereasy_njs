import { describe, expect, it } from "vitest";
import { billOversells } from "./posOversell";

const line = { track_inventory: true, quantity: 5, cart_quantity: 2 };

describe("billOversells", () => {
    it("is false when every line is within its stock", () => {
        expect(billOversells([line, { ...line, quantity: 3, cart_quantity: 3 }])).toBe(false);
    });

    it("is true when a line is billed for more than its stock", () => {
        expect(billOversells([line, { ...line, quantity: 1, cart_quantity: 2 }])).toBe(true);
    });

    it("is true for a line with no stock left", () => {
        expect(billOversells([{ ...line, quantity: 0, cart_quantity: 1 }])).toBe(true);
        expect(billOversells([{ ...line, quantity: -2, cart_quantity: 1 }])).toBe(true);
    });

    it("reads stock sent as text and fractional quantities", () => {
        expect(billOversells([{ ...line, quantity: "2.500", cart_quantity: 2.5 }])).toBe(false);
        expect(billOversells([{ ...line, quantity: "2.400", cart_quantity: 2.5 }])).toBe(true);
    });

    it("ignores lines that do not track stock", () => {
        expect(billOversells([{ track_inventory: false, quantity: 0, cart_quantity: 9 }])).toBe(false);
    });

    it("does not guess when the stock is unknown", () => {
        expect(billOversells([{ ...line, quantity: null }])).toBe(false);
        expect(billOversells([{ ...line, quantity: undefined }])).toBe(false);
        expect(billOversells([{ ...line, quantity: "" }])).toBe(false);
        expect(billOversells([{ ...line, quantity: "n/a" }])).toBe(false);
    });

    it("is false for an empty bill", () => {
        expect(billOversells([])).toBe(false);
    });
});
