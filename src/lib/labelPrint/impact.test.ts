import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_FIELDS } from "./templates";
import { buildLabelPrintDocument } from "./html";
import {
  addProductToPrintList,
  consumePrintProductIds,
  enqueuePrintProductIds,
  parsePrintProductIds,
  productToPrintItem,
  totalLabelCount,
  updatePrintListItem,
} from "./printList";
import type { LabelTemplatePrefs, PrintLabelItem } from "./types";

/** Dummy kirana catalog used to simulate POS cart, bulk select, and price-update reprint. */
const catalog = [
  { id: 101, name: "Toor Dal", barcode: "8901234567890", original_price: 120, price: 99, unit: "kg" },
  { id: 102, name: "Aata 10kg", barcode: "SKU-AATA-10", original_price: 480, price: 450, unit: "bag" },
  { id: 103, name: "Mustard Oil", barcode: "890123456789", original_price: 180, price: 165, unit: "ltr" },
];

const prefs = (overrides: Partial<LabelTemplatePrefs> = {}): LabelTemplatePrefs => ({
  sizeId: "50x25",
  columns: 1,
  barcodeFormat: "CODE128",
  fields: { ...DEFAULT_LABEL_FIELDS, weight: true, packingDate: true, expiryDate: true },
  ...overrides,
});

describe("OE-274 impact paths with dummy catalog data", () => {
  it("seeds a POS cart query (?ids=) into a print list and expands quantities", () => {
    const fromPos = parsePrintProductIds(null, "101,102,101,nope");
    expect(fromPos).toEqual([101, 102]);

    let list: PrintLabelItem[] = [];
    for (const id of fromPos) {
      const product = catalog.find((row) => row.id === id)!;
      list = addProductToPrintList(list, product, prefs().fields);
    }
    list = updatePrintListItem(list, 101, { quantity: 3, weightLabel: "1kg", packingDate: "2026-09-04" });

    expect(list).toHaveLength(2);
    expect(totalLabelCount(list)).toBe(4);

    const html = buildLabelPrintDocument({
      shopName: "Sharma Kirana",
      prefs: prefs({ columns: 2 }),
      items: list,
    });
    expect(html).toContain("@page { size: 100mm 25mm; margin: 0; }");
    expect(html.match(/Toor Dal/g)?.length).toBe(3);
    expect(html).toContain("Aata 10kg");
    expect(html).toContain("Pkd 04/09/2026");
  });

  it("consumes a Products bulk-select queue once, like the Print Labels button", () => {
    const storage = {
      data: new Map<string, string>(),
      getItem(key: string) { return this.data.get(key) ?? null; },
      setItem(key: string, value: string) { this.data.set(key, value); },
      removeItem(key: string) { this.data.delete(key); },
    };
    enqueuePrintProductIds(catalog.map((row) => row.id), storage);
    const queued = consumePrintProductIds(storage);
    expect(queued).toEqual([101, 102, 103]);
    expect(consumePrintProductIds(storage)).toEqual([]);
  });

  it("reprints a single item after a price update via ?productId=", () => {
    const ids = parsePrintProductIds("103", null);
    expect(ids).toEqual([103]);
    const item = productToPrintItem(
      { ...catalog[2], price: 159 },
      DEFAULT_LABEL_FIELDS,
    );
    const html = buildLabelPrintDocument({
      shopName: "Sharma Kirana",
      prefs: prefs({ barcodeFormat: "EAN13" }),
      items: [item],
    });
    expect(html).toContain("Mustard Oil");
    expect(html).toContain("₹159");
    expect(html).toContain('data-format="EAN13"');
  });

  it("keeps per-row field overrides when only the sticker size changes", () => {
    const customized = {
      ...DEFAULT_LABEL_FIELDS,
      shopName: false,
      mrp: false,
    };
    const item = productToPrintItem(catalog[0], customized);
    const htmlAfterSizeChange = buildLabelPrintDocument({
      shopName: "Sharma Kirana",
      prefs: prefs({ sizeId: "38x25", columns: 3, fields: DEFAULT_LABEL_FIELDS }),
      items: [item],
    });
    expect(htmlAfterSizeChange).toContain("@page { size: 114mm 25mm; margin: 0; }");
    expect(htmlAfterSizeChange).not.toContain("Sharma Kirana");
    expect(htmlAfterSizeChange).not.toContain("MRP");
    expect(htmlAfterSizeChange).toContain("Toor Dal");
  });
});
