import { resolveBarcodeFormat } from "./barcode";
import { getLabelSize, pageSizeMm } from "./templates";
import type { LabelPrintContext, PrintLabelItem, VisibleLabelContent } from "./types";

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatInr(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `₹${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
}

export function formatLabelDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!day || !month || !year) return iso;
  return `${day}/${month}/${year}`;
}

export function getVisibleLabelContent(item: PrintLabelItem, shopName: string): VisibleLabelContent {
  const flags = item.fields;
  const weight = item.weightLabel.trim() || item.unit;
  return {
    shopName: flags.shopName && shopName ? shopName : null,
    productName: flags.productName && item.name ? item.name : null,
    mrp: flags.mrp && formatInr(item.mrp) ? formatInr(item.mrp) : null,
    sellingPrice: flags.sellingPrice && formatInr(item.price) ? formatInr(item.price) : null,
    weight: flags.weight && weight ? weight : null,
    packingDate: flags.packingDate && item.packingDate ? formatLabelDate(item.packingDate) : null,
    expiryDate: flags.expiryDate && item.expiryDate ? formatLabelDate(item.expiryDate) : null,
    barcode: flags.barcode && item.barcode ? item.barcode : null,
  };
}

function expandItems(items: PrintLabelItem[]): PrintLabelItem[] {
  const expanded: PrintLabelItem[] = [];
  for (const item of items) {
    const copies = Math.max(0, Math.floor(Number(item.quantity) || 0));
    for (let i = 0; i < copies; i++) expanded.push(item);
  }
  return expanded;
}

function renderLabelInner(item: PrintLabelItem, shopName: string, barcodeFormat: LabelPrintContext["prefs"]["barcodeFormat"]): string {
  const visible = getVisibleLabelContent(item, shopName);
  const parts: string[] = [];

  if (visible.shopName) {
    parts.push(`<div class="shop">${escapeHtml(visible.shopName)}</div>`);
  }
  if (visible.productName) {
    parts.push(`<div class="name">${escapeHtml(visible.productName)}</div>`);
  }

  const priceBits: string[] = [];
  if (visible.mrp) priceBits.push(`<span class="mrp">MRP ${escapeHtml(visible.mrp)}</span>`);
  if (visible.sellingPrice) priceBits.push(`<span class="price">${escapeHtml(visible.sellingPrice)}</span>`);
  if (priceBits.length) parts.push(`<div class="prices">${priceBits.join(" ")}</div>`);

  const metaBits: string[] = [];
  if (visible.weight) metaBits.push(escapeHtml(visible.weight));
  if (visible.packingDate) metaBits.push(`Pkd ${escapeHtml(visible.packingDate)}`);
  if (visible.expiryDate) metaBits.push(`Exp ${escapeHtml(visible.expiryDate)}`);
  if (metaBits.length) parts.push(`<div class="meta">${metaBits.join(" · ")}</div>`);

  if (visible.barcode) {
    const format = resolveBarcodeFormat(visible.barcode, barcodeFormat);
    parts.push(
      `<svg class="barcode" data-value="${escapeHtml(visible.barcode)}" data-format="${format}"></svg>`,
    );
  }

  return parts.join("");
}

export function buildLabelPrintDocument(context: LabelPrintContext): string {
  const { shopName, prefs, items } = context;
  const size = getLabelSize(prefs.sizeId);
  const page = pageSizeMm(prefs.sizeId, prefs.columns);
  const copies = expandItems(items);
  const labels = copies.map(
    (item) => `<div class="label">${renderLabelInner(item, shopName, prefs.barcodeFormat)}</div>`,
  );

  const rows: string[] = [];
  for (let i = 0; i < labels.length; i += prefs.columns) {
    const slice = labels.slice(i, i + prefs.columns);
    while (slice.length < prefs.columns) {
      slice.push(`<div class="label empty"></div>`);
    }
    rows.push(`<div class="sheet-row">${slice.join("")}</div>`);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Print Labels</title>
  <style>
    @page { size: ${page.widthMm}mm ${page.heightMm}mm; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .sheet-row {
      display: grid;
      grid-template-columns: repeat(${prefs.columns}, ${size.widthMm}mm);
      width: ${page.widthMm}mm;
      height: ${size.heightMm}mm;
      page-break-after: always;
      break-after: page;
    }
    .label {
      width: ${size.widthMm}mm;
      height: ${size.heightMm}mm;
      box-sizing: border-box;
      overflow: hidden;
      padding: 0.8mm 1.1mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
    }
    .label.empty { visibility: hidden; }
    .shop { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; text-align: center; }
    .name { font-size: 9px; font-weight: 700; line-height: 1.15; max-height: 22px; overflow: hidden; }
    .prices { display: flex; justify-content: space-between; align-items: baseline; font-size: 8px; }
    .mrp { text-decoration: line-through; opacity: 0.75; }
    .price { font-weight: 800; font-size: 10px; }
    .meta { font-size: 6.5px; }
    svg.barcode { width: 100%; height: 11mm; }
  </style>
</head>
<body>
  ${rows.join("")}
</body>
</html>`;
}
