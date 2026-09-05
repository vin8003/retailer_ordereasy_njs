import { resolveBarcodeFormat } from "./barcode";
import { getLabelSize, pageSizeMm } from "./templates";
import type { BarcodeFormat, LabelPrintContext, PrintLabelItem, VisibleLabelContent } from "./types";

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
  const mrp = flags.mrp ? formatInr(item.mrp) : "";
  const sellingPrice = flags.sellingPrice ? formatInr(item.price) : "";
  return {
    shopName: flags.shopName && shopName ? shopName : null,
    productName: flags.productName && item.name ? item.name : null,
    mrp: mrp || null,
    sellingPrice: sellingPrice || null,
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

/** Inner sticker markup shared by live preview and print. */
export function renderLabelInner(
  item: PrintLabelItem,
  shopName: string,
  barcodeFormat: BarcodeFormat,
): string {
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
      `<div class="barcode-slot"><svg class="barcode" data-value="${escapeHtml(visible.barcode)}" data-format="${format}"></svg></div>`,
    );
  }

  return parts.join("");
}

/**
 * Compact sticker CSS used by both the live preview and print output.
 * Tuned so shop + name + prices + barcode fit inside 25mm height without clipping.
 */
export function stickerLabelCss(widthMm: number, heightMm: number): string {
  return `
    .label {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      box-sizing: border-box;
      overflow: hidden;
      padding: 0.5mm 1.1mm 0.3mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.2mm;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
    }
    .label.empty { visibility: hidden; }
    .shop {
      font-size: 2mm;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      text-align: center;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .name {
      font-size: 2.3mm;
      font-weight: 700;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .prices {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1mm;
      font-size: 2.1mm;
      line-height: 1.1;
      flex-shrink: 0;
    }
    .mrp { text-decoration: line-through; opacity: 0.75; white-space: nowrap; }
    .price { font-weight: 800; font-size: 2.4mm; white-space: nowrap; }
    .meta {
      font-size: 1.8mm;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .barcode-slot {
      margin-top: auto;
      height: 9mm;
      min-height: 9mm;
      max-height: 9mm;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    svg.barcode {
      display: block;
      /* Let the SVG render at its native pixel size, then scale down to fit.
       * Using max-width instead of width:100% avoids upscaling a small barcode
       * which causes blur on 203 DPI thermal printers. */
      max-width: 100%;
      max-height: 9mm;
      height: auto;
      width: auto;
    }
    @media print {
      svg.barcode {
        /* In print, let the SVG use its intrinsic size (vector = sharp at any DPI).
         * The browser rasterizer maps vector paths to printer dots cleanly. */
        width: auto !important;
        height: 9mm !important;
        max-width: 100% !important;
      }
    }
  `;
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

  // @page uses plain dimensions only — no landscape/portrait keyword.
  // The TVS LP46NEO driver treats width as roll width and height as feed length.
  // Forcing landscape swaps the two and rotates the print 90°.
  const pageSizeRule = `${page.widthMm}mm ${page.heightMm}mm`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Print Labels</title>
  <style>
    @page { size: ${pageSizeRule}; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .sheet-row {
      display: grid;
      grid-template-columns: repeat(${prefs.columns}, ${size.widthMm}mm);
      width: ${page.widthMm}mm;
      height: ${page.heightMm}mm;
      box-sizing: border-box;
      align-content: start;
      align-items: start;
      page-break-after: always;
      break-after: page;
    }
    .sheet-row:last-child { page-break-after: auto; break-after: auto; }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    ${stickerLabelCss(size.widthMm, size.heightMm)}
  </style>
</head>
<body>
  ${rows.join("")}
</body>
</html>`;
}
