import JsBarcode from "jsbarcode";
import { resolveBarcodeFormat } from "./barcode";
import type { BarcodeFormat } from "./types";

function barcodeOptions(format: BarcodeFormat) {
  return {
    format,
    displayValue: true,
    fontSize: 10,
    margin: 0,
    height: 32,
    width: 1.15,
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

export function printLabelDocument(html: string): void {
  if (typeof document === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
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

  const renderAndPrint = () => {
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
  }
}
