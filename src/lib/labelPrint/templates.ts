import type { ColumnCount, LabelFieldFlags, LabelSize, LabelSizeId, LabelTemplatePrefs } from "./types";

/** Die-cut row pitch gap below each sticker row (mm). The printer's gap sensor
 * handles this physically; we expose it only for preview spacing, not @page. */
export const LABEL_ROW_GAP_MM = 2;

export const LABEL_SIZES: LabelSize[] = [
  { id: "50x25", label: "50mm × 25mm", widthMm: 50, heightMm: 25 },
  { id: "38x25", label: "38mm × 25mm", widthMm: 38, heightMm: 25 },
];

export const DEFAULT_LABEL_FIELDS: LabelFieldFlags = {
  shopName: true,
  productName: true,
  mrp: true,
  sellingPrice: true,
  weight: false,
  packingDate: false,
  expiryDate: false,
  barcode: true,
};

export const DEFAULT_LABEL_PREFS: LabelTemplatePrefs = {
  sizeId: "50x25",
  columns: 1,
  barcodeFormat: "CODE128",
  fields: { ...DEFAULT_LABEL_FIELDS },
};

export function getLabelSize(id: LabelSizeId): LabelSize {
  return LABEL_SIZES.find((size) => size.id === id) ?? LABEL_SIZES[0];
}

export function pageSizeMm(sizeId: LabelSizeId, columns: ColumnCount): { widthMm: number; heightMm: number } {
  const size = getLabelSize(sizeId);
  // Page height is the sticker height only. The printer's gap sensor handles
  // the die-cut gap between labels — do NOT add it to @page or the row rotates.
  return {
    widthMm: size.widthMm * columns,
    heightMm: size.heightMm,
  };
}

/** Human-readable paper size for the browser / printer dialog. */
export function formatPrintPaperSize(sizeId: LabelSizeId, columns: ColumnCount): string {
  const page = pageSizeMm(sizeId, columns);
  return `${page.widthMm}mm × ${page.heightMm}mm`;
}
