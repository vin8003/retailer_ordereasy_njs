import { describe, expect, it } from "vitest";
import { getPurchaseDetailTdsAmountLabel } from "./purchaseDetailTds";

const formatInr = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);

describe("getPurchaseDetailTdsAmountLabel", () => {
    it("formats a present numeric tds_amount as compact INR, including 0", () => {
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: 250 })).toBe(formatInr(250));
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: "1200.00" })).toBe(formatInr(1200));
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: 12.5 })).toBe(formatInr(12.5));
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: "  80  " })).toBe(formatInr(80));
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: 0 })).toBe(formatInr(0));
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: "0" })).toBe(formatInr(0));
    });

    it("returns null when tds_amount is omitted, null, or blank", () => {
        expect(getPurchaseDetailTdsAmountLabel({})).toBeNull();
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: undefined })).toBeNull();
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: null })).toBeNull();
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: "" })).toBeNull();
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: "   " })).toBeNull();
    });

    it("does not invent tds_amount from totals, tax, or tds_percent", () => {
        expect(
            getPurchaseDetailTdsAmountLabel({
                total_amount: 10000,
                paid_amount: 9000,
                tax_amount: 1800,
                gst_amount: 1800,
                tds: 250,
                tds_percent: 2,
                tds_amount: null,
            })
        ).toBeNull();
    });

    it("returns null for non-numeric or non-finite present values", () => {
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: "n/a" })).toBeNull();
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: Number.NaN })).toBeNull();
        expect(getPurchaseDetailTdsAmountLabel({ tds_amount: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
