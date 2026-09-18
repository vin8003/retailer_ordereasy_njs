import { describe, expect, it } from "vitest";
import { getPurchaseReturnInvoiceNumber } from "./purchaseReturnInvoiceNumber";

describe("getPurchaseReturnInvoiceNumber", () => {
    it("returns the trimmed invoice_number when BE sent a non-empty string", () => {
        expect(getPurchaseReturnInvoiceNumber({ invoice_number: "INV-44" })).toBe("INV-44");
        expect(getPurchaseReturnInvoiceNumber({ invoice_number: "  PI-100  " })).toBe("PI-100");
    });

    it("returns null when invoice_number is omitted, null, or blank", () => {
        expect(getPurchaseReturnInvoiceNumber({})).toBeNull();
        expect(getPurchaseReturnInvoiceNumber({ invoice_number: undefined })).toBeNull();
        expect(getPurchaseReturnInvoiceNumber({ invoice_number: null })).toBeNull();
        expect(getPurchaseReturnInvoiceNumber({ invoice_number: "" })).toBeNull();
        expect(getPurchaseReturnInvoiceNumber({ invoice_number: "   " })).toBeNull();
    });

    it("does not invent invoice_number from return_number, supplier_name, or id", () => {
        expect(
            getPurchaseReturnInvoiceNumber({
                return_number: "RET-9",
                supplier_name: "ABC Foods",
                id: 9,
            })
        ).toBeNull();
        expect(
            getPurchaseReturnInvoiceNumber({
                return_number: "RET-9",
                supplier_name: "ABC Foods",
                id: 9,
                invoice_number: null,
            })
        ).toBeNull();
    });
});
