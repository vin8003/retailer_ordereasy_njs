import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_FIELDS } from "./templates";
import {
  addProductToPrintList,
  consumePrintProductIds,
  enqueuePrintProductIds,
  parsePrintProductIds,
  productToPrintItem,
  removePrintListItem,
  totalLabelCount,
  updatePrintListItem,
} from "./printList";

const product = {
  id: 7,
  name: "Aata",
  barcode: "111",
  original_price: 50,
  price: 45,
  unit: "kg",
};

describe("print list", () => {
  it("maps a catalog product onto a print row with default quantity 1", () => {
    const item = productToPrintItem(product, DEFAULT_LABEL_FIELDS);
    expect(item).toMatchObject({
      id: 7,
      name: "Aata",
      barcode: "111",
      mrp: 50,
      price: 45,
      unit: "kg",
      quantity: 1,
    });
  });

  it("adds a new product or bumps quantity when the same product is added again", () => {
    const once = addProductToPrintList([], product, DEFAULT_LABEL_FIELDS);
    expect(once).toHaveLength(1);
    const twice = addProductToPrintList(once, product, DEFAULT_LABEL_FIELDS);
    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe(2);
  });

  it("updates quantity and dates, ignoring non-positive quantities", () => {
    const list = addProductToPrintList([], product, DEFAULT_LABEL_FIELDS);
    const updated = updatePrintListItem(list, 7, { quantity: 5, packingDate: "2026-01-01" });
    expect(updated[0].quantity).toBe(5);
    expect(updated[0].packingDate).toBe("2026-01-01");
    expect(updatePrintListItem(updated, 7, { quantity: 0 })[0].quantity).toBe(5);
    expect(updatePrintListItem(updated, 7, { quantity: -3 })[0].quantity).toBe(5);
  });

  it("removes a row and counts expanded labels", () => {
    const list = updatePrintListItem(
      addProductToPrintList([], product, DEFAULT_LABEL_FIELDS),
      7,
      { quantity: 4 },
    );
    expect(totalLabelCount(list)).toBe(4);
    expect(removePrintListItem(list, 7)).toEqual([]);
    expect(totalLabelCount([])).toBe(0);
  });

  it("queues product ids and consumes them once", () => {
    const storage = {
      data: new Map<string, string>(),
      getItem(key: string) { return this.data.get(key) ?? null; },
      setItem(key: string, value: string) { this.data.set(key, value); },
      removeItem(key: string) { this.data.delete(key); },
    };
    enqueuePrintProductIds([7, 7, 8, Number.NaN], storage);
    expect(consumePrintProductIds(storage)).toEqual([7, 8]);
    expect(consumePrintProductIds(storage)).toEqual([]);
  });

  it("parses productId and csv ids while dropping junk", () => {
    expect(parsePrintProductIds("12", "12,13,nope,-1")).toEqual([12, 13]);
    expect(parsePrintProductIds(null, "")).toEqual([]);
  });
});
