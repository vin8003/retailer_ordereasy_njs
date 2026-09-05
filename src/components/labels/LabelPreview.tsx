"use client";

import { useLayoutEffect, useRef } from "react";
import { getLabelSize, renderBarcodeSvg, renderLabelInner, stickerLabelCss } from "@/lib/labelPrint";
import type { BarcodeFormat, LabelSizeId, PrintLabelItem } from "@/lib/labelPrint";

/** CSS pixels in 1mm at 96dpi. Preview `scale` is px-per-mm; this converts it for transform. */
const CSS_PX_PER_MM = 96 / 25.4;

interface LabelPreviewProps {
  item: PrintLabelItem;
  shopName: string;
  sizeId: LabelSizeId;
  barcodeFormat: BarcodeFormat;
  /** Preview pixels per millimetre of sticker. */
  scale?: number;
}

export function LabelPreview({ item, shopName, sizeId, barcodeFormat, scale = 4.4 }: LabelPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const size = getLabelSize(sizeId);
  const visualScale = scale / CSS_PX_PER_MM;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${stickerLabelCss(size.widthMm, size.heightMm)}</style><div class="label">${renderLabelInner(item, shopName, barcodeFormat)}</div>`;
    shadow.querySelectorAll("svg.barcode").forEach((svg) => {
      const value = svg.getAttribute("data-value") || "";
      const format = (svg.getAttribute("data-format") || "CODE128") as BarcodeFormat;
      renderBarcodeSvg(svg, value, format);
    });
  }, [item, shopName, sizeId, barcodeFormat, size.widthMm, size.heightMm]);

  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-white shadow-inner"
      style={{ width: size.widthMm * scale, height: size.heightMm * scale }}
    >
      <div
        ref={hostRef}
        style={{
          width: `${size.widthMm}mm`,
          height: `${size.heightMm}mm`,
          transform: `scale(${visualScale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
