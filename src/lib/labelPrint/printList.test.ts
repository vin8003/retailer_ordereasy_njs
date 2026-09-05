import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_FIELDS } from "./templates";
import {
  addProductToPrintList,
  applyDefaultFieldsToList,
  consumePrintProductIds,
  enqueuePrintProductIds,
  parsePrintProductIds,
  productToPrintItem,
  readPrintProductIds,
  removePrintListItem,
  resolveProductBarcode,
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

  it("falls back to batch / additional barcodes when primary barcode is empty", () => {
    expect(
      resolveProductBarcode({
        id: 9,
        name: "Oil",
        barcode: null,
        batches: [{ barcode: "8909999999999" }],
      }),
    ).toBe("8909999999999");

    const fromBatch = productToPrintItem(
      {
        id: 9,
        name: "Oil",
        barcode: null,
        price: 100,
        batches: [{ barcode: "8909999999999" }],
      },
      DEFAULT_LABEL_FIELDS,
    );
    expect(fromBatch.barcode).toBe("8909999999999");

    const fromAdditional = productToPrintItem(
      {
        id: 10,
        name: "Soap",
        barcode: "",
        price: 20,
        additional_barcodes: ["SOAP-ALT-1"],
      },
      DEFAULT_LABEL_FIELDS,
    );
    expect(fromAdditional.barcode).toBe("SOAP-ALT-1");
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
    enqueuePrintProductIds([7, 7, 8, Number.NaN, 0, -3], storage);
    expect(readPrintProductIds(storage)).toEqual([7, 8]);
    expect(consumePrintProductIds(storage)).toEqual([7, 8]);
    expect(consumePrintProductIds(storage)).toEqual([]);
  });

  it("parses productId and csv ids while dropping junk", () => {
    expect(parsePrintProductIds("12", "12,13,nope,-1")).toEqual([12, 13]);
    expect(parsePrintProductIds(null, "")).toEqual([]);
  });

  it("applies new default fields only to rows that still match the previous defaults", () => {
    const defaults = { ...DEFAULT_LABEL_FIELDS };
    const customized = { ...DEFAULT_LABEL_FIELDS, shopName: false };
    const list = [
      { ...productToPrintItem(product, defaults), id: 7 },
      { ...productToPrintItem({ ...product, id: 8, name: "Oil" }, customized) },
    ];
    const next = { ...defaults, mrp: false };
    const updated = applyDefaultFieldsToList(list, defaults, next);
    expect(updated[0].fields.mrp).toBe(false);
    expect(updated[1].fields.shopName).toBe(false);
    expect(updated[1].fields.mrp).toBe(true);
  });
});
