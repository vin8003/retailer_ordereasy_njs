import { describe, expect, it } from "vitest";
import { getPurchaseInvoiceDate } from "./purchaseInvoiceDate";

const formatInvoiceDate = (raw: string) =>
    new Date(raw).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

describe("getPurchaseInvoiceDate", () => {
    it("returns the formatted invoice_date when BE sent a present valid date", () => {
        expect(getPurchaseInvoiceDate({ invoice_date: "2026-09-18" })).toBe(
            formatInvoiceDate("2026-09-18")
        );
        expect(getPurchaseInvoiceDate({ invoice_date: "  2026-01-05  " })).toBe(
            formatInvoiceDate("2026-01-05")
        );
        expect(getPurchaseInvoiceDate({ invoice_date: "2026-09-18T10:00:00.000Z" })).toBe(
            formatInvoiceDate("2026-09-18T10:00:00.000Z")
        );
    });

    it("returns null when invoice_date is omitted, null, or blank", () => {
        expect(getPurchaseInvoiceDate({})).toBeNull();
        expect(getPurchaseInvoiceDate({ invoice_date: undefined })).toBeNull();
        expect(getPurchaseInvoiceDate({ invoice_date: null })).toBeNull();
        expect(getPurchaseInvoiceDate({ invoice_date: "" })).toBeNull();
        expect(getPurchaseInvoiceDate({ invoice_date: "   " })).toBeNull();
    });

    it("does not invent invoice_date from created_at, return_date, or other fields", () => {
        expect(
            getPurchaseInvoiceDate({
                created_at: "2026-09-01T08:00:00.000Z",
                return_date: "2026-09-02",
                updated_at: "2026-09-03",
                invoice_number: "INV-44",
            })
        ).toBeNull();
        expect(
            getPurchaseInvoiceDate({
                created_at: "2026-09-01T08:00:00.000Z",
                return_date: "2026-09-02",
                invoice_date: null,
            })
        ).toBeNull();
    });

    it("returns null for non-date or invalid invoice_date values", () => {
        expect(getPurchaseInvoiceDate({ invoice_date: "n/a" })).toBeNull();
        expect(getPurchaseInvoiceDate({ invoice_date: "not-a-date" })).toBeNull();
    });
});
