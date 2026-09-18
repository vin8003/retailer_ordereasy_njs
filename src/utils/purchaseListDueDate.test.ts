import { describe, expect, it } from "vitest";
import {
    getPurchaseListDueDateLabel,
    isPurchaseListUnpaidInvoice,
} from "./purchaseListDueDate";

const dueDate = "2026-09-18";
const formattedDue = new Date(2026, 8, 18).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

describe("isPurchaseListUnpaidInvoice", () => {
    it("treats UNPAID, PARTIAL, and missing status as unpaid invoice rows", () => {
        expect(isPurchaseListUnpaidInvoice({ payment_status: "UNPAID" })).toBe(true);
        expect(isPurchaseListUnpaidInvoice({ payment_status: "PARTIAL" })).toBe(true);
        expect(isPurchaseListUnpaidInvoice({ payment_status: "unpaid" })).toBe(true);
        expect(isPurchaseListUnpaidInvoice({})).toBe(true);
        expect(isPurchaseListUnpaidInvoice({ payment_status: "" })).toBe(true);
        expect(isPurchaseListUnpaidInvoice({ type: "invoice", payment_status: null })).toBe(true);
    });

    it("does not treat PAID invoices or purchase returns as unpaid", () => {
        expect(isPurchaseListUnpaidInvoice({ payment_status: "PAID" })).toBe(false);
        expect(isPurchaseListUnpaidInvoice({ payment_status: "paid" })).toBe(false);
        expect(
            isPurchaseListUnpaidInvoice({ type: "return", payment_status: "UNPAID", due_date: dueDate })
        ).toBe(false);
    });
});

describe("getPurchaseListDueDateLabel", () => {
    it("returns the formatted due_date when an unpaid row has a present date", () => {
        expect(
            getPurchaseListDueDateLabel({ payment_status: "UNPAID", due_date: dueDate })
        ).toBe(formattedDue);
        expect(
            getPurchaseListDueDateLabel({ payment_status: "PARTIAL", due_date: " 2026-09-18 " })
        ).toBe(formattedDue);
        expect(
            getPurchaseListDueDateLabel({ payment_status: "UNPAID", due_date: "2026-09-18T00:00:00" })
        ).toBe(formattedDue);
    });

    it("returns null when due_date is omitted, null, blank, or unparseable", () => {
        expect(getPurchaseListDueDateLabel({ payment_status: "UNPAID" })).toBeNull();
        expect(getPurchaseListDueDateLabel({ payment_status: "UNPAID", due_date: undefined })).toBeNull();
        expect(getPurchaseListDueDateLabel({ payment_status: "UNPAID", due_date: null })).toBeNull();
        expect(getPurchaseListDueDateLabel({ payment_status: "UNPAID", due_date: "" })).toBeNull();
        expect(getPurchaseListDueDateLabel({ payment_status: "UNPAID", due_date: "   " })).toBeNull();
        expect(getPurchaseListDueDateLabel({ payment_status: "UNPAID", due_date: "not-a-date" })).toBeNull();
    });

    it("does not show due_date on paid invoices or return rows even when present", () => {
        expect(
            getPurchaseListDueDateLabel({ payment_status: "PAID", due_date: dueDate })
        ).toBeNull();
        expect(
            getPurchaseListDueDateLabel({ type: "return", payment_status: "UNPAID", due_date: dueDate })
        ).toBeNull();
    });

    it("does not invent due_date from invoice_date, created_at, or credit_due_days", () => {
        expect(
            getPurchaseListDueDateLabel({
                payment_status: "UNPAID",
                invoice_date: dueDate,
                created_at: "2026-09-18T10:00:00.000Z",
                credit_due_days: 15,
                due_date: null,
            })
        ).toBeNull();
    });
});
