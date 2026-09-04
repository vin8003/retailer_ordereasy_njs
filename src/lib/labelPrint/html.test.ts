import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_FIELDS } from "./templates";
import { buildLabelPrintDocument, escapeHtml, getVisibleLabelContent } from "./html";
import type { LabelPrintContext, PrintLabelItem } from "./types";

const sampleItem = (overrides: Partial<PrintLabelItem> = {}): PrintLabelItem => ({
  id: 11,
  name: "Toor Dal",
  barcode: "8901234567890",
  mrp: 120,
  price: 99,
  unit: "kg",
  weightLabel: "1kg",
  packingDate: "2026-09-04",
  expiryDate: "2027-03-04",
  quantity: 1,
  fields: { ...DEFAULT_LABEL_FIELDS },
  ...overrides,
});

const sampleContext = (overrides: Partial<LabelPrintContext> = {}): LabelPrintContext => ({
  shopName: "Sharma Kirana",
  prefs: {
    sizeId: "50x25",
    columns: 1,
    barcodeFormat: "CODE128",
    fields: { ...DEFAULT_LABEL_FIELDS },
  },
  items: [sampleItem()],
  ...overrides,
});

describe("getVisibleLabelContent", () => {
  it("includes toggled-on fields and skips empty values", () => {
    const visible = getVisibleLabelContent(
      sampleItem({
        fields: {
          ...DEFAULT_LABEL_FIELDS,
          weight: true,
          packingDate: true,
          expiryDate: true,
        },
      }),
      "Sharma Kirana",
    );
    expect(visible.shopName).toBe("Sharma Kirana");
    expect(visible.productName).toBe("Toor Dal");
    expect(visible.mrp).toContain("120");
    expect(visible.sellingPrice).toContain("99");
    expect(visible.weight).toBe("1kg");
    expect(visible.packingDate).toBe("04/09/2026");
    expect(visible.expiryDate).toBe("04/03/2027");
    expect(visible.barcode).toBe("8901234567890");
  });

  it("omits fields that are toggled off", () => {
    const item = sampleItem({
      fields: {
        ...DEFAULT_LABEL_FIELDS,
        shopName: false,
        mrp: false,
        packingDate: false,
        expiryDate: false,
        weight: false,
      },
    });
    const visible = getVisibleLabelContent(item, "Sharma Kirana");
    expect(visible.shopName).toBeNull();
    expect(visible.mrp).toBeNull();
    expect(visible.packingDate).toBeNull();
    expect(visible.expiryDate).toBeNull();
    expect(visible.weight).toBeNull();
    expect(visible.productName).toBe("Toor Dal");
    expect(visible.sellingPrice).toContain("99");
  });
});

describe("buildLabelPrintDocument", () => {
  it("emits @page size matching the 1-column 50x25 sticker", () => {
    const html = buildLabelPrintDocument(sampleContext());
    expect(html).toContain("@page { size: 50mm 25mm; margin: 0; }");
  });

  it("widens @page for 2-column 38x25 rolls", () => {
    const html = buildLabelPrintDocument(
      sampleContext({
        prefs: {
          sizeId: "38x25",
          columns: 2,
          barcodeFormat: "CODE128",
          fields: { ...DEFAULT_LABEL_FIELDS },
        },
      }),
    );
    expect(html).toContain("@page { size: 76mm 25mm; margin: 0; }");
    expect(html).toContain("grid-template-columns: repeat(2, 38mm)");
  });

  it("repeats a product once per requested label quantity", () => {
    const html = buildLabelPrintDocument(
      sampleContext({ items: [sampleItem({ quantity: 3 })] }),
    );
    expect(html.match(/Toor Dal/g)?.length).toBe(3);
  });

  it("emits no labels when quantity is zero", () => {
    const html = buildLabelPrintDocument(
      sampleContext({ items: [sampleItem({ quantity: 0 })] }),
    );
    expect(html).not.toContain("Toor Dal");
    expect(html).not.toContain('class="label"');
  });

  it("omits shop name and MRP from the print DOM when those flags are off", () => {
    const html = buildLabelPrintDocument(
      sampleContext({
        items: [
          sampleItem({
            fields: { ...DEFAULT_LABEL_FIELDS, shopName: false, mrp: false },
          }),
        ],
      }),
    );
    expect(html).not.toContain("Sharma Kirana");
    expect(html).not.toContain("MRP");
    expect(html).toContain("Toor Dal");
  });

  it("escapes product names so markup cannot break the print document", () => {
    const html = buildLabelPrintDocument(
      sampleContext({
        items: [sampleItem({ name: `<img src=x onerror="alert(1)">` })],
      }),
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain(escapeHtml(`<img src=x onerror="alert(1)">`));
  });

  it("stamps barcode svgs with the resolved format", () => {
    const html = buildLabelPrintDocument(
      sampleContext({
        prefs: {
          sizeId: "50x25",
          columns: 1,
          barcodeFormat: "EAN13",
          fields: { ...DEFAULT_LABEL_FIELDS },
        },
      }),
    );
    expect(html).toContain('data-format="EAN13"');
    expect(html).toContain('data-value="8901234567890"');
  });

  it("does not emit a barcode svg when the product has no barcode", () => {
    const html = buildLabelPrintDocument(
      sampleContext({ items: [sampleItem({ barcode: "" })] }),
    );
    expect(html).not.toContain("svg class=\"barcode\"");
  });
});
