export type BarcodeFormat = "CODE128" | "EAN13";

export type DisplayLabelSizeId = "75x50" | "100x75" | "A4_21" | "75x25" | "75x75";

export interface DisplayLabelFieldFlags {
  productName: boolean;
  mrp: boolean;
  sellingPrice: boolean;
  savings: boolean;
  discount: boolean;
  barcode: boolean;
}

export type DisplayLabelLayoutStyle = "vertical" | "horizontal" | "square";

export interface DisplayLabelSize {
  id: DisplayLabelSizeId;
  label: string;
  widthMm: number;
  heightMm: number;
  layoutStyle: DisplayLabelLayoutStyle;
  isA4: boolean;
  columns?: number;
  rows?: number;
  pageWidthMm?: number;
  pageHeightMm?: number;
}

export interface DisplayLabelTemplatePrefs {
  sizeId: DisplayLabelSizeId;
  barcodeFormat: BarcodeFormat;
  fields: DisplayLabelFieldFlags;
}

export interface DisplayLabelItem {
  id: number;
  name: string;
  barcode: string;
  mrp: number | string | null;
  price: number | string;
  quantity: number;
  fields: DisplayLabelFieldFlags;
  savingsOverride: string;
  discountOverride: string;
}

export interface DisplayLabelPrintContext {
  prefs: DisplayLabelTemplatePrefs;
  items: DisplayLabelItem[];
}

export interface VisibleDisplayLabelContent {
  productName: string | null;
  mrp: string | null;
  sellingPrice: string | null;
  savings: string | null;
  discount: string | null;
  barcode: string | null;
}
