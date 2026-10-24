import { describe, expect, it } from "vitest";
import { parsePurchaseInvoiceNumberFromText, purchaseDetailsHref } from "./purchaseLinks";

describe("parsePurchaseInvoiceNumberFromText", () => {
    it("reads the invoice number from purchase log reasons", () => {
        expect(parsePurchaseInvoiceNumberFromText("Purchase Inward: Invoice #INV-7")).toBe("INV-7");
        expect(parsePurchaseInvoiceNumberFromText("Purchase Updated: Invoice #A 12/B")).toBe("A 12/B");
        expect(parsePurchaseInvoiceNumberFromText("Purchase Edit (Reversal): Invoice #9")).toBe("9");
    });
    it("ignores deleted invoices and unrelated reasons", () => {
        expect(parsePurchaseInvoiceNumberFromText("Purchase Invoice Deleted: #INV-7")).toBeNull();
        expect(parsePurchaseInvoiceNumberFromText("Order #55")).toBeNull();
        expect(parsePurchaseInvoiceNumberFromText(null)).toBeNull();
    });
});

describe("purchaseDetailsHref", () => {
    it("prefers the id", () => {
        expect(purchaseDetailsHref({ id: 4, invoiceNumber: "X" })).toBe("/dashboard/purchases/edit?id=4");
    });
    it("falls back to an encoded number", () => {
        expect(purchaseDetailsHref({ invoiceNumber: "A 1/B" })).toBe("/dashboard/purchases/edit?number=A%201%2FB");
        expect(purchaseDetailsHref({})).toBeNull();
    });
});
