"use client";

import { useEffect, useRef } from "react";
import { getLabelSize, getVisibleLabelContent, renderBarcodeSvg } from "@/lib/labelPrint";
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
  const svgRef = useRef<SVGSVGElement>(null);
  const size = getLabelSize(sizeId);
  const visible = getVisibleLabelContent(item, shopName);
  const visualScale = scale / CSS_PX_PER_MM;

  useEffect(() => {
    if (!svgRef.current || !visible.barcode) return;
    renderBarcodeSvg(svgRef.current, visible.barcode, barcodeFormat);
  }, [visible.barcode, barcodeFormat, sizeId, visible.productName, visible.shopName]);

  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-white shadow-inner"
      style={{ width: size.widthMm * scale, height: size.heightMm * scale }}
    >
      <div
        className="flex flex-col justify-between bg-white text-black"
        style={{
          width: `${size.widthMm}mm`,
          height: `${size.heightMm}mm`,
          padding: "0.8mm 1.1mm",
          transform: `scale(${visualScale})`,
          transformOrigin: "top left",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div>
          {visible.shopName && (
            <div className="text-center font-bold uppercase" style={{ fontSize: "7px" }}>
              {visible.shopName}
            </div>
          )}
          {visible.productName && (
            <div className="font-bold leading-tight" style={{ fontSize: "9px" }}>
              {visible.productName}
            </div>
          )}
        </div>
        <div>
          {(visible.mrp || visible.sellingPrice) && (
            <div className="flex items-baseline justify-between" style={{ fontSize: "8px" }}>
              {visible.mrp ? <span className="line-through opacity-75">MRP {visible.mrp}</span> : <span />}
              {visible.sellingPrice && <span className="font-extrabold" style={{ fontSize: "10px" }}>{visible.sellingPrice}</span>}
            </div>
          )}
          {(visible.weight || visible.packingDate || visible.expiryDate) && (
            <div style={{ fontSize: "6.5px" }}>
              {[visible.weight, visible.packingDate && `Pkd ${visible.packingDate}`, visible.expiryDate && `Exp ${visible.expiryDate}`]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
          {visible.barcode && (
            <svg ref={svgRef} className="w-full" style={{ height: "11mm" }} />
          )}
        </div>
      </div>
    </div>
  );
}
