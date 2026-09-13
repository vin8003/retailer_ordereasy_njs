import { describe, expect, it } from "vitest";
import {
  buildPosUpiQr,
  buildUpiIntentUri,
  buildUpiTxnRef,
  formatUpiAmount,
  resolveUpiPayableAmount,
  type PosUpiQrInput,
} from "./upiIntent";

describe("formatUpiAmount", () => {
  it("always renders two decimals", () => {
    expect(formatUpiAmount(499)).toBe("499.00");
    expect(formatUpiAmount(499.5)).toBe("499.50");
  });

  it("rounds to paise", () => {
    expect(formatUpiAmount(10.005)).toBe("10.01");
    expect(formatUpiAmount(10.004)).toBe("10.00");
  });
});

describe("resolveUpiPayableAmount", () => {
  const split = { cash: 300, upi: 200, credit: 0 };

  it("uses the full bill total when paying fully by UPI", () => {
    expect(resolveUpiPayableAmount({ paymentMode: "upi", total: 500, paymentSplit: split })).toBe(500);
  });

  it("uses only the UPI portion of a split", () => {
    expect(resolveUpiPayableAmount({ paymentMode: "split", total: 500, paymentSplit: split })).toBe(200);
  });

  it("is zero for cash and credit", () => {
    expect(resolveUpiPayableAmount({ paymentMode: "cash", total: 500, paymentSplit: split })).toBe(0);
    expect(resolveUpiPayableAmount({ paymentMode: "credit", total: 500, paymentSplit: split })).toBe(0);
  });

  it("never goes negative", () => {
    expect(
      resolveUpiPayableAmount({ paymentMode: "split", total: 500, paymentSplit: { cash: 0, upi: -50, credit: 0 } })
    ).toBe(0);
  });
});

describe("buildUpiTxnRef", () => {
  it("strips punctuation and uppercases", () => {
    expect(buildUpiTxnRef({ billRef: "pos-101", amount: 499.5, nonce: "17" })).toBe("OEPOS1014995017");
  });

  it("changes when the amount changes", () => {
    const a = buildUpiTxnRef({ billRef: "POS101", amount: 200, nonce: "17" });
    const b = buildUpiTxnRef({ billRef: "POS101", amount: 250, nonce: "17" });
    expect(a).not.toBe(b);
  });

  it("changes when the nonce changes", () => {
    const a = buildUpiTxnRef({ billRef: "POS101", amount: 200, nonce: "17" });
    const b = buildUpiTxnRef({ billRef: "POS101", amount: 200, nonce: "18" });
    expect(a).not.toBe(b);
  });

  it("caps length at 35 characters", () => {
    const ref = buildUpiTxnRef({ billRef: "B".repeat(60), amount: 200, nonce: "1758000000000" });
    expect(ref).toHaveLength(35);
  });
});

describe("buildUpiIntentUri", () => {
  const base = {
    upiId: "shop@okhdfcbank",
    shopName: "Sharma Kirana",
    amount: 499.5,
    billRef: "POS101",
    txnRef: "OEPOS1014995017",
  };

  it("builds the NPCI intent in the expected parameter order", () => {
    expect(buildUpiIntentUri(base)).toBe(
      "upi://pay?pa=shop%40okhdfcbank&pn=Sharma%20Kirana&am=499.50&cu=INR&tn=OE-POS101&tr=OEPOS1014995017"
    );
  });

  it("returns null when the shop has no upi id", () => {
    expect(buildUpiIntentUri({ ...base, upiId: "" })).toBeNull();
    expect(buildUpiIntentUri({ ...base, upiId: "   " })).toBeNull();
  });

  it("returns null when nothing is payable", () => {
    expect(buildUpiIntentUri({ ...base, amount: 0 })).toBeNull();
    expect(buildUpiIntentUri({ ...base, amount: -10 })).toBeNull();
  });
});

describe("buildPosUpiQr", () => {
  const input: PosUpiQrInput = {
    paymentMode: "upi",
    total: 499.5,
    paymentSplit: { cash: 0, upi: 0, credit: 0 },
    upiId: "shop@okhdfcbank",
    shopName: "Sharma Kirana",
    billRef: "POS101",
    nonce: "17",
  };

  it("smoke: full UPI bill uses the bill total as am", () => {
    const qr = buildPosUpiQr(input);
    expect(qr).toEqual({
      status: "ready",
      amount: 499.5,
      txnRef: "OEPOS1014995017",
      intentUri:
        "upi://pay?pa=shop%40okhdfcbank&pn=Sharma%20Kirana&am=499.50&cu=INR&tn=OE-POS101&tr=OEPOS1014995017",
    });
  });

  it("smoke: split bill uses only the UPI portion as am", () => {
    const qr = buildPosUpiQr({
      ...input,
      paymentMode: "split",
      total: 499.5,
      paymentSplit: { cash: 299.5, upi: 200, credit: 0 },
    });

    expect(qr.status).toBe("ready");
    if (qr.status !== "ready") return;
    expect(qr.amount).toBe(200);
    expect(qr.intentUri).toContain("am=200.00");
    expect(qr.intentUri).not.toContain("am=499.50");
  });

  it("regenerates the intent when the split UPI amount changes", () => {
    const split = { ...input, paymentMode: "split" as const, paymentSplit: { cash: 300, upi: 200, credit: 0 } };
    const before = buildPosUpiQr(split);
    const after = buildPosUpiQr({ ...split, paymentSplit: { cash: 250, upi: 250, credit: 0 } });

    expect(before.status).toBe("ready");
    expect(after.status).toBe("ready");
    if (before.status !== "ready" || after.status !== "ready") return;
    expect(after.intentUri).not.toBe(before.intentUri);
    expect(after.txnRef).not.toBe(before.txnRef);
    expect(after.intentUri).toContain("am=250.00");
  });

  it("reports the empty state when the shop has no upi id", () => {
    expect(buildPosUpiQr({ ...input, upiId: null })).toEqual({ status: "missing_upi_id" });
    expect(buildPosUpiQr({ ...input, upiId: "  " })).toEqual({ status: "missing_upi_id" });
  });

  it("stays hidden for cash and credit bills", () => {
    expect(buildPosUpiQr({ ...input, paymentMode: "cash" })).toEqual({ status: "hidden" });
    expect(buildPosUpiQr({ ...input, paymentMode: "credit" })).toEqual({ status: "hidden" });
  });

  it("stays hidden while nothing is payable by UPI", () => {
    expect(buildPosUpiQr({ ...input, total: 0 })).toEqual({ status: "hidden" });
    expect(buildPosUpiQr({ ...input, paymentMode: "split" })).toEqual({ status: "hidden" });
  });

  it("falls back to a generic payee name when the shop name is missing", () => {
    const qr = buildPosUpiQr({ ...input, shopName: null });
    expect(qr.status).toBe("ready");
    if (qr.status !== "ready") return;
    expect(qr.intentUri).toContain("pn=OrderEasy%20Store");
  });
});
