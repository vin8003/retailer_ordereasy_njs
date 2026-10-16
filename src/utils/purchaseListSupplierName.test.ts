import { describe, expect, it } from "vitest";
import { getPurchaseListSupplierName } from "./purchaseListSupplierName";

describe("getPurchaseListSupplierName", () => {
    it("returns the trimmed supplier_name when BE sent a non-empty string", () => {
        expect(getPurchaseListSupplierName({ supplier_name: "ABC Foods" })).toBe("ABC Foods");
        expect(getPurchaseListSupplierName({ supplier_name: "  Metro Cash  " })).toBe("Metro Cash");
    });

    it("returns null when supplier_name is omitted, null, or blank", () => {
        expect(getPurchaseListSupplierName({})).toBeNull();
        expect(getPurchaseListSupplierName({ supplier_name: undefined })).toBeNull();
        expect(getPurchaseListSupplierName({ supplier_name: null })).toBeNull();
        expect(getPurchaseListSupplierName({ supplier_name: "" })).toBeNull();
        expect(getPurchaseListSupplierName({ supplier_name: "   " })).toBeNull();
    });

    it("does not invent supplier_name from invoice_number, notes, or distributor_name", () => {
        expect(
            getPurchaseListSupplierName({
                invoice_number: "INV-44",
                payment_status: "PAID",
                notes: "Paid at shop",
                distributor_name: "ABC Foods",
            })
        ).toBeNull();
        expect(
            getPurchaseListSupplierName({
                invoice_number: "INV-44",
                notes: "Paid at shop",
                distributor_name: "ABC Foods",
                supplier_name: null,
            })
        ).toBeNull();
    });
});
