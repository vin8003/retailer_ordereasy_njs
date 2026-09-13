import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpiQrPanel } from "./UpiQrPanel";
import type { PosPaymentMode, PosPaymentSplit } from "@/lib/upiIntent";

const noSplit: PosPaymentSplit = { cash: 0, upi: 0, credit: 0 };

function render(props: {
  paymentMode: PosPaymentMode;
  total: number;
  paymentSplit?: PosPaymentSplit;
  upiId?: string | null;
}) {
  return renderToStaticMarkup(
    <UpiQrPanel
      paymentMode={props.paymentMode}
      total={props.total}
      paymentSplit={props.paymentSplit ?? noSplit}
      upiId={props.upiId === undefined ? "shop@okhdfcbank" : props.upiId}
      shopName="Sharma Kirana"
      billRef="POSMB1XYZ"
    />
  );
}

describe("UpiQrPanel", () => {
  it("smoke: renders a QR for the full bill total when paying by UPI", () => {
    const markup = render({ paymentMode: "upi", total: 499.5 });

    expect(markup).toContain("Scan to pay");
    expect(markup).toContain("₹499.50");
    expect(markup).toContain("Full bill amount");
    expect(markup).toContain("<svg");
    expect(markup).toContain("<path");
  });

  it("smoke: renders a QR for the UPI portion only when the bill is split", () => {
    const markup = render({
      paymentMode: "split",
      total: 499.5,
      paymentSplit: { cash: 299.5, upi: 200, credit: 0 },
    });

    expect(markup).toContain("₹200.00");
    expect(markup).toContain("UPI portion of this split bill");
    expect(markup).not.toContain("₹499.50");
  });

  it("redraws the QR when the split UPI amount changes before settle", () => {
    const before = render({
      paymentMode: "split",
      total: 500,
      paymentSplit: { cash: 300, upi: 200, credit: 0 },
    });
    const after = render({
      paymentMode: "split",
      total: 500,
      paymentSplit: { cash: 250, upi: 250, credit: 0 },
    });

    expect(after).not.toBe(before);
    expect(after).toContain("₹250.00");
  });

  it("shows the empty state instead of a QR when the shop has no upi id", () => {
    const markup = render({ paymentMode: "upi", total: 499.5, upiId: null });

    expect(markup).toContain("No UPI ID on file");
    expect(markup).not.toContain("Scan to pay");
  });

  it("renders nothing for cash and credit bills", () => {
    expect(render({ paymentMode: "cash", total: 499.5 })).toBe("");
    expect(render({ paymentMode: "credit", total: 499.5 })).toBe("");
  });

  it("renders nothing while the UPI portion of a split is still zero", () => {
    expect(render({ paymentMode: "split", total: 499.5 })).toBe("");
  });
});
