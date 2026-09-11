import type {
  DisplayLabelFieldFlags,
  DisplayLabelSize,
  DisplayLabelSizeId,
  DisplayLabelTemplatePrefs,
} from "./display-types";

export const DISPLAY_LABEL_SIZES: DisplayLabelSize[] = [
  {
    id: "100x75",
    label: "Thermal Roll (100mm × 75mm)",
    widthMm: 100,
    heightMm: 75,
    isA4: false,
  },
  {
    id: "75x50",
    label: "Thermal Roll (75mm × 50mm)",
    widthMm: 75,
    heightMm: 50,
    isA4: false,
  },
  {
    id: "A4_21",
    label: "A4 Sheet (21 labels, 63.5mm × 38.1mm)",
    widthMm: 63.5,
    heightMm: 38.1,
    isA4: true,
    columns: 3,
    rows: 7,
    pageWidthMm: 210,
    pageHeightMm: 297,
  },
];

export const DEFAULT_DISPLAY_LABEL_FIELDS: DisplayLabelFieldFlags = {
  productName: true,
  mrp: true,
  sellingPrice: true,
  savings: true,
  discount: true,
  barcode: true,
};

export const DEFAULT_DISPLAY_LABEL_PREFS: DisplayLabelTemplatePrefs = {
  sizeId: "75x50",
  barcodeFormat: "CODE128",
  fields: { ...DEFAULT_DISPLAY_LABEL_FIELDS },
};

export function getDisplayLabelSize(id: DisplayLabelSizeId): DisplayLabelSize {
  return DISPLAY_LABEL_SIZES.find((size) => size.id === id) ?? DISPLAY_LABEL_SIZES[0];
}
