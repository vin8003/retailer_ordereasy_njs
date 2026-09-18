import { describe, expect, it } from "vitest";
import { getPurchaseDetailLrDate } from "./purchaseDetailLrDate";

describe("getPurchaseDetailLrDate", () => {
    it("returns the lr_date text when BE sent a present non-empty value", () => {
        expect(getPurchaseDetailLrDate({ lr_date: "2026-09-18" })).toBe("2026-09-18");
        expect(getPurchaseDetailLrDate({ lr_date: "  2026-09-01  " })).toBe("2026-09-01");
        expect(getPurchaseDetailLrDate({ lr_date: "18 Sep 2026" })).toBe("18 Sep 2026");
    });

    it("returns null when lr_date is omitted, null, or blank", () => {
        expect(getPurchaseDetailLrDate({})).toBeNull();
        expect(getPurchaseDetailLrDate({ lr_date: undefined })).toBeNull();
        expect(getPurchaseDetailLrDate({ lr_date: null })).toBeNull();
        expect(getPurchaseDetailLrDate({ lr_date: "" })).toBeNull();
        expect(getPurchaseDetailLrDate({ lr_date: "   " })).toBeNull();
    });

    it("does not invent lr_date from invoice_date, created_at, lr_number, or nested lr", () => {
        expect(
            getPurchaseDetailLrDate({
                invoice_date: "2026-01-01",
                created_at: "2026-02-02T10:00:00.000Z",
                dispatch_date: "2026-03-03",
                invoice_number: "INV-44",
                notes: "Paid at shop",
                bill_image: "https://cdn.example/bill.jpg",
                payment_status: "PAID",
                supplier_name: "ABC Foods",
                lr_number: "LR-999",
                lr_no: "888",
                lr: { date: "2026-04-04" },
            })
        ).toBeNull();
        expect(
            getPurchaseDetailLrDate({
                invoice_date: "2026-01-01",
                lr_number: "LR-999",
                lr_date: null,
            })
        ).toBeNull();
    });
});
