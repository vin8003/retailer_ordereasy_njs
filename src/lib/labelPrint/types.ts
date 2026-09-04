export type BarcodeFormat = "CODE128" | "EAN13";
export type LabelSizeId = "50x25" | "38x25";
export type ColumnCount = 1 | 2 | 3;

export interface LabelFieldFlags {
  shopName: boolean;
  productName: boolean;
  mrp: boolean;
  sellingPrice: boolean;
  weight: boolean;
  packingDate: boolean;
  expiryDate: boolean;
  barcode: boolean;
}

export interface LabelSize {
  id: LabelSizeId;
  label: string;
  widthMm: number;
  heightMm: number;
}

export interface LabelTemplatePrefs {
  sizeId: LabelSizeId;
  columns: ColumnCount;
  barcodeFormat: BarcodeFormat;
  fields: LabelFieldFlags;
}

export interface PrintLabelItem {
  id: number;
  name: string;
  barcode: string;
  mrp: number | string | null;
  price: number | string;
  unit: string;
  weightLabel: string;
  packingDate: string;
  expiryDate: string;
  quantity: number;
  fields: LabelFieldFlags;
}

export interface LabelPrintContext {
  shopName: string;
  prefs: LabelTemplatePrefs;
  items: PrintLabelItem[];
}

export interface VisibleLabelContent {
  shopName: string | null;
  productName: string | null;
  mrp: string | null;
  sellingPrice: string | null;
  weight: string | null;
  packingDate: string | null;
  expiryDate: string | null;
  barcode: string | null;
}
