import JsBarcode from "jsbarcode";
import { resolveBarcodeFormat } from "./barcode";
import type { BarcodeFormat } from "./types";

/**
 * JsBarcode options tuned for 203 DPI thermal printers (TVS LP46NEO etc.).
 *
 * At 203 DPI, 1 dot = 0.125mm. A bar must be ≥2 dots (0.25mm) to print sharp.
 * - width: 2.5 → each module ≈ 0.31mm (2.5 dots) — scannable and crisp.
 * - height: 50 → tall enough for reliable scanning after CSS scaling to ~8mm.
 * - fontSize: 11 → readable on small labels at 203 DPI.
 * - margin: 0 → no whitespace around the barcode (we control padding in CSS).
 */
function barcodeOptions(format: BarcodeFormat) {
  return {
    format,
    displayValue: true,
    fontSize: 11,
    font: "Arial",
    fontOptions: "bold",
    textAlign: "center",
    textPosition: "bottom",
    textMargin: 1,
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    height: 50,
    width: 2.5,
    background: "#ffffff",
    lineColor: "#000000",
  };
}

export function renderBarcodeSvg(svg: Element, value: string, preferred: BarcodeFormat): void {
  if (!value) return;
  const format = resolveBarcodeFormat(value, preferred);
  try {
    JsBarcode(svg, value, barcodeOptions(format));
  } catch {
    JsBarcode(svg, value, barcodeOptions("CODE128"));
  }
}

export function printLabelDocument(
  html: string,
  _page?: { widthMm: number; heightMm: number },
): void {
  if (typeof document === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  // Off-screen but sized: Chrome often skips print/JsBarcode on a 0×0 iframe.
  // Keep a generic size — do NOT match @page here; the print dialog handles that.
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    iframe.remove();
  };

  let printed = false;
  const renderAndPrint = () => {
    if (printed) return;
    printed = true;
    doc.querySelectorAll("svg.barcode").forEach((svg) => {
      const value = svg.getAttribute("data-value") || "";
      const format = (svg.getAttribute("data-format") || "CODE128") as BarcodeFormat;
      renderBarcodeSvg(svg, value, format);
    });
    win.addEventListener("afterprint", cleanup);
    win.focus();
    win.print();
    window.setTimeout(cleanup, 60_000);
  };

  if (doc.readyState === "complete") {
    renderAndPrint();
  } else {
    iframe.onload = renderAndPrint;
    window.setTimeout(renderAndPrint, 250);
  }
}
