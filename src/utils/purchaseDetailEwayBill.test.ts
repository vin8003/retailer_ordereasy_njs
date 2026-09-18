import { describe, expect, it } from "vitest";
import { getPurchaseDetailEwayBill } from "./purchaseDetailEwayBill";

describe("getPurchaseDetailEwayBill", () => {
    it("returns the eway_bill text when BE sent a present non-empty value", () => {
        expect(getPurchaseDetailEwayBill({ eway_bill: "141234567890" })).toBe("141234567890");
        expect(getPurchaseDetailEwayBill({ eway_bill: 141234567890 })).toBe("141234567890");
        expect(getPurchaseDetailEwayBill({ eway_bill: "  1412  " })).toBe("1412");
        expect(getPurchaseDetailEwayBill({ eway_bill: 0 })).toBe("0");
        expect(getPurchaseDetailEwayBill({ eway_bill: "0" })).toBe("0");
    });

    it("returns null when eway_bill is omitted, null, or blank", () => {
        expect(getPurchaseDetailEwayBill({})).toBeNull();
        expect(getPurchaseDetailEwayBill({ eway_bill: undefined })).toBeNull();
        expect(getPurchaseDetailEwayBill({ eway_bill: null })).toBeNull();
        expect(getPurchaseDetailEwayBill({ eway_bill: "" })).toBeNull();
        expect(getPurchaseDetailEwayBill({ eway_bill: "   " })).toBeNull();
    });

    it("does not invent eway_bill from invoice_number, notes, bill_image, or nested eway", () => {
        expect(
            getPurchaseDetailEwayBill({
                invoice_number: "INV-44",
                notes: "Paid at shop",
                bill_image: "https://cdn.example/bill.jpg",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
                ewb_no: "999",
                eway_bill_number: "888",
                eway: { bill: "777" },
            })
        ).toBeNull();
        expect(
            getPurchaseDetailEwayBill({
                invoice_number: "INV-44",
                notes: "Paid at shop",
                eway_bill: null,
            })
        ).toBeNull();
    });

    it("returns null for non-finite numeric eway_bill", () => {
        expect(getPurchaseDetailEwayBill({ eway_bill: Number.NaN })).toBeNull();
        expect(getPurchaseDetailEwayBill({ eway_bill: Number.POSITIVE_INFINITY })).toBeNull();
    });
});
