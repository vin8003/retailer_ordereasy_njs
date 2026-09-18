import { describe, expect, it } from "vitest";
import { getPurchaseDetailEwayValidUpto } from "./purchaseDetailEwayValidUpto";

describe("getPurchaseDetailEwayValidUpto", () => {
    it("returns the eway_valid_upto text when BE sent a present non-empty value", () => {
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: "2026-09-20 23:59:00" })).toBe(
            "2026-09-20 23:59:00"
        );
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: "18/09/2026 11:59:00 PM" })).toBe(
            "18/09/2026 11:59:00 PM"
        );
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: "  2026-09-21  " })).toBe("2026-09-21");
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: 0 })).toBe("0");
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: "0" })).toBe("0");
    });

    it("returns null when eway_valid_upto is omitted, null, or blank", () => {
        expect(getPurchaseDetailEwayValidUpto({})).toBeNull();
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: undefined })).toBeNull();
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: null })).toBeNull();
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: "" })).toBeNull();
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: "   " })).toBeNull();
    });

    it("does not invent eway_valid_upto from invoice_date, eway_bill, or nested eway", () => {
        expect(
            getPurchaseDetailEwayValidUpto({
                invoice_number: "INV-44",
                notes: "Paid at shop",
                bill_image: "https://cdn.example/bill.jpg",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
                invoice_date: "2026-09-18",
                eway_bill: "141234567890",
                eway_bill_number: "888",
                valid_upto: "2026-12-31",
                ewb_valid_upto: "2026-10-01",
                eway: { valid_upto: "2026-11-01" },
            })
        ).toBeNull();
        expect(
            getPurchaseDetailEwayValidUpto({
                invoice_number: "INV-44",
                invoice_date: "2026-09-18",
                eway_bill: "141234567890",
                eway_valid_upto: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric eway_valid_upto", () => {
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: Number.NaN })).toBeNull();
        expect(getPurchaseDetailEwayValidUpto({ eway_valid_upto: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
