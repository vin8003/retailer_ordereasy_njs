import type { ColumnCount, LabelFieldFlags, LabelSize, LabelSizeId, LabelTemplatePrefs } from "./types";

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
  return {
    widthMm: size.widthMm * columns,
    heightMm: size.heightMm,
  };
}
