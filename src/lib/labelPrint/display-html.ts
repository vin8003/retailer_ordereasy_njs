import { resolveBarcodeFormat } from "./barcode";
import { getDisplayLabelSize } from "./display-templates";
import type {
  BarcodeFormat,
  DisplayLabelPrintContext,
  DisplayLabelItem,
  VisibleDisplayLabelContent,
  DisplayLabelLayoutStyle,
} from "./display-types";

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

export function getVisibleDisplayLabelContent(item: DisplayLabelItem): VisibleDisplayLabelContent {
  const flags = item.fields;
  const mrp = flags.mrp ? formatInr(item.mrp) : "";
  const sellingPrice = flags.sellingPrice ? formatInr(item.price) : "";
  return {
    productName: flags.productName && item.name ? item.name : null,
    mrp: mrp || null,
    sellingPrice: sellingPrice || null,
    savings: flags.savings && item.savingsOverride ? item.savingsOverride : null,
    discount: flags.discount && item.discountOverride ? item.discountOverride : null,
    barcode: flags.barcode && item.barcode ? item.barcode : null,
  };
}

function expandDisplayItems(items: DisplayLabelItem[]): DisplayLabelItem[] {
  const expanded: DisplayLabelItem[] = [];
  for (const item of items) {
    const copies = Math.max(0, Math.floor(Number(item.quantity) || 0));
    for (let i = 0; i < copies; i++) expanded.push(item);
  }
  return expanded;
}

export function renderDisplayLabelInner(
  item: DisplayLabelItem,
  barcodeFormat: BarcodeFormat,
  layoutStyle: DisplayLabelLayoutStyle
): string {
  const visible = getVisibleDisplayLabelContent(item);
  
  if (layoutStyle === "horizontal") {
    // 3:1 aspect ratio layout
    return `
      <div class="hz-left">
        ${visible.productName ? `<div class="name">${escapeHtml(visible.productName)}</div>` : ""}
        ${(visible.discount || visible.savings) ? `
          <div class="promo-header">
            ${visible.discount ? `<div class="discount">${escapeHtml(visible.discount)}</div>` : ""}
            ${visible.savings ? `<div class="savings">${escapeHtml(visible.savings)}</div>` : ""}
          </div>
        ` : ""}
      </div>
      <div class="hz-right">
        ${(visible.mrp || visible.sellingPrice) ? `
          <div class="prices">
            ${visible.sellingPrice ? `<div class="price">${escapeHtml(visible.sellingPrice)}</div>` : ""}
            ${visible.mrp ? `<div class="mrp-wrapper">MRP: <span class="mrp">${escapeHtml(visible.mrp)}</span></div>` : ""}
          </div>
        ` : ""}
        ${visible.barcode ? `
          <div class="barcode-slot">
            <svg class="barcode" data-value="${escapeHtml(visible.barcode)}" data-format="${resolveBarcodeFormat(visible.barcode, barcodeFormat)}"></svg>
          </div>
        ` : ""}
      </div>
    `;
  }

  // Vertical or Square layout
  const parts: string[] = [];

  if (visible.discount || visible.savings) {
    const promoParts: string[] = [];
    if (visible.discount) promoParts.push(`<div class="discount">${escapeHtml(visible.discount)}</div>`);
    if (visible.savings) promoParts.push(`<div class="savings">${escapeHtml(visible.savings)}</div>`);
    parts.push(`<div class="promo-header">${promoParts.join("")}</div>`);
  }

  if (visible.productName) {
    parts.push(`<div class="name">${escapeHtml(visible.productName)}</div>`);
  }

  if (visible.mrp || visible.sellingPrice) {
    parts.push(`<div class="prices">`);
    if (visible.mrp) {
      parts.push(`<div class="mrp-wrapper">MRP: <span class="mrp">${escapeHtml(visible.mrp)}</span></div>`);
    }
    if (visible.sellingPrice) {
      parts.push(`<div class="price">${escapeHtml(visible.sellingPrice)}</div>`);
    }
    parts.push(`</div>`);
  }

  if (visible.barcode) {
    const format = resolveBarcodeFormat(visible.barcode, barcodeFormat);
    parts.push(
      `<div class="barcode-slot"><svg class="barcode" data-value="${escapeHtml(visible.barcode)}" data-format="${format}"></svg></div>`,
    );
  }

  return parts.join("");
}

export function displayLabelCss(widthMm: number, heightMm: number, isA4: boolean, layoutStyle: DisplayLabelLayoutStyle): string {
  const isHorizontal = layoutStyle === "horizontal";
  
  return `
    .label {
      width: ${isA4 ? `${widthMm}mm` : '100%'};
      height: ${isA4 ? `${heightMm}mm` : '100%'};
      box-sizing: border-box;
      overflow: hidden;
      padding: ${isA4 ? "2mm" : "3mm"};
      display: flex;
      flex-direction: ${isHorizontal ? "row" : "column"};
      justify-content: ${isHorizontal ? "space-between" : "flex-start"};
      gap: 1mm;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      ${isA4 ? "border: 0.1mm dashed #ccc;" : ""}
    }
    .label.empty { visibility: hidden; }
    
    ${isHorizontal ? `
      .hz-left, .hz-right {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }
      .hz-left { width: 50%; }
      .hz-right { width: 45%; align-items: flex-end; justify-content: center; gap: 1mm; }
      .name { font-size: 4.5mm; font-weight: 700; line-height: 1.2; max-height: 10mm; overflow: hidden; }
      .promo-header { display: flex; gap: 1mm; background: #000; color: #fff; padding: 1mm 2mm; border-radius: 1mm; font-weight: bold; font-size: 4mm; }
      .price { font-weight: 900; font-size: 11mm; white-space: nowrap; line-height: 1; }
      .mrp-wrapper { font-size: 3.5mm; color: #333; }
      .mrp { text-decoration: line-through; }
      .barcode-slot { height: 7mm; display: flex; align-items: flex-end; justify-content: flex-end; overflow: hidden; }
      svg.barcode { max-height: 7mm; width: auto; }
    ` : `
      .promo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #000;
        color: #fff;
        padding: 1.5mm 3mm;
        border-radius: 1mm;
        font-weight: bold;
        flex-shrink: 0;
      }
      .discount {
        font-size: ${layoutStyle === 'square' ? '6mm' : '5mm'};
        text-transform: uppercase;
      }
      .savings {
        font-size: ${layoutStyle === 'square' ? '5mm' : '4.5mm'};
      }
      .name {
        font-size: ${layoutStyle === 'square' ? '7mm' : '5.5mm'};
        font-weight: 700;
        line-height: 1.2;
        max-height: 14mm;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        flex-shrink: 0;
        text-align: center;
        margin-top: 2mm;
      }
      .prices {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1mm;
        margin-top: 2mm;
        flex-shrink: 0;
      }
      .mrp-wrapper {
        font-size: ${layoutStyle === 'square' ? '5.5mm' : '4.5mm'};
        color: #333;
      }
      .mrp { 
        text-decoration: line-through; 
      }
      .price { 
        font-weight: 900; 
        font-size: ${layoutStyle === 'square' ? '18mm' : '15mm'}; 
        white-space: nowrap; 
        line-height: 1;
      }
      .barcode-slot {
        margin-top: auto;
        height: 12mm;
        min-height: 12mm;
        max-height: 12mm;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;
      }
      svg.barcode {
        display: block;
        max-width: 100%;
        max-height: 12mm;
        height: auto;
        width: auto;
      }
    `}

    @media print {
      .label {
        ${isA4 ? "border: none !important;" : ""}
      }
      svg.barcode {
        width: auto !important;
        height: ${isHorizontal ? '7mm' : '12mm'} !important;
        max-width: 100% !important;
      }
    }
  `;
}

export function buildDisplayLabelPrintDocument(context: DisplayLabelPrintContext): string {
  const { prefs, items } = context;
  const size = getDisplayLabelSize(prefs.sizeId);
  const copies = expandDisplayItems(items);
  const labels = copies.map(
    (item) => `<div class="label">${renderDisplayLabelInner(item, prefs.barcodeFormat, size.layoutStyle)}</div>`,
  );

  let pageSizeRule = "";
  let bodyContent = "";

  if (size.isA4 && size.columns && size.rows && size.pageWidthMm && size.pageHeightMm) {
    const labelsPerPage = size.columns * size.rows;
    const pages: string[] = [];
    
    const contentWidth = size.widthMm * size.columns;
    const contentHeight = size.heightMm * size.rows;
    const marginLeft = (size.pageWidthMm - contentWidth) / 2;
    const marginTop = (size.pageHeightMm - contentHeight) / 2;

    for (let i = 0; i < labels.length; i += labelsPerPage) {
      const pageLabels = labels.slice(i, i + labelsPerPage);
      while (pageLabels.length < labelsPerPage) {
        pageLabels.push(`<div class="label empty"></div>`);
      }
      pages.push(`<div class="a4-page">
        <div class="a4-grid">${pageLabels.join("")}</div>
      </div>`);
    }

    pageSizeRule = `A4 portrait`;
    bodyContent = `
      <style>
        .a4-page {
          width: ${size.pageWidthMm}mm;
          height: ${size.pageHeightMm}mm;
          box-sizing: border-box;
          padding-left: ${marginLeft}mm;
          padding-top: ${marginTop}mm;
          page-break-after: always;
          break-after: page;
        }
        .a4-page:last-child { page-break-after: auto; break-after: auto; }
        .a4-grid {
          display: grid;
          grid-template-columns: repeat(${size.columns}, ${size.widthMm}mm);
          grid-template-rows: repeat(${size.rows}, ${size.heightMm}mm);
        }
      </style>
      ${pages.join("")}
    `;
  } else {
    pageSizeRule = `${size.widthMm}mm ${size.heightMm}mm`;
    const rows: string[] = [];
    for (let i = 0; i < labels.length; i++) {
      rows.push(`<div class="sheet-row">${labels[i]}</div>`);
    }
    bodyContent = `
      <style>
        .sheet-row {
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          page-break-after: always;
          break-after: page;
        }
        .sheet-row:last-child { page-break-after: auto; break-after: auto; }
      </style>
      ${rows.join("")}
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Print Display Labels</title>
  <style>
    @page { size: ${pageSizeRule}; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    ${displayLabelCss(size.widthMm, size.heightMm, size.isA4, size.layoutStyle)}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}
