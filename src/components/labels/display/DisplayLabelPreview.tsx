"use client";

import { useLayoutEffect, useRef } from "react";
import {
  getDisplayLabelSize,
  renderBarcodeSvg,
  renderDisplayLabelInner,
  displayLabelCss,
} from "@/lib/labelPrint";
import type { BarcodeFormat, DisplayLabelSizeId, DisplayLabelItem } from "@/lib/labelPrint";

const CSS_PX_PER_MM = 96 / 25.4;

interface DisplayLabelPreviewProps {
  item: DisplayLabelItem;
  sizeId: DisplayLabelSizeId;
  barcodeFormat: BarcodeFormat;
  scale?: number;
}

export function DisplayLabelPreview({
  item,
  sizeId,
  barcodeFormat,
  scale = 3.5, // slightly smaller default scale because display labels are larger
}: DisplayLabelPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const size = getDisplayLabelSize(sizeId);
  const visualScale = scale / CSS_PX_PER_MM;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${displayLabelCss(size.widthMm, size.heightMm, size.isA4, size.layoutStyle)}</style><div class="label">${renderDisplayLabelInner(item, barcodeFormat, size.layoutStyle)}</div>`;
    shadow.querySelectorAll("svg.barcode").forEach((svg) => {
      const value = svg.getAttribute("data-value") || "";
      const format = (svg.getAttribute("data-format") || "CODE128") as BarcodeFormat;
      renderBarcodeSvg(svg, value, format);
    });
  }, [item, sizeId, barcodeFormat, size.widthMm, size.heightMm, size.isA4, size.layoutStyle]);

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
