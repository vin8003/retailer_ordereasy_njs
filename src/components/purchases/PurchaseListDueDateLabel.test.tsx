import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PurchaseListDueDateLabel } from "./PurchaseListDueDateLabel";

const dueDate = "2026-09-18";
const formattedDue = new Date(2026, 8, 18).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

describe("PurchaseListDueDateLabel", () => {
    it("shows muted due text on unpaid rows when BE sent due_date", () => {
        const markup = renderToStaticMarkup(
            <PurchaseListDueDateLabel row={{ payment_status: "UNPAID", due_date: dueDate }} />
        );
        expect(markup).toContain(`Due ${formattedDue}`);
        expect(markup).toContain(formattedDue);
    });

    it("shows due text on PARTIAL rows when due_date is present", () => {
        const markup = renderToStaticMarkup(
            <PurchaseListDueDateLabel row={{ payment_status: "PARTIAL", due_date: dueDate }} />
        );
        expect(markup).toContain(`Due ${formattedDue}`);
    });

    it("renders nothing when due_date is omitted, null, or blank", () => {
        expect(
            renderToStaticMarkup(<PurchaseListDueDateLabel row={{ payment_status: "UNPAID" }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseListDueDateLabel row={{ payment_status: "UNPAID", due_date: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseListDueDateLabel row={{ payment_status: "UNPAID", due_date: "" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseListDueDateLabel row={{ payment_status: "UNPAID", due_date: "   " }} />
            )
        ).toBe("");
    });

    it("renders nothing on paid invoices and returns even when due_date is present", () => {
        expect(
            renderToStaticMarkup(
                <PurchaseListDueDateLabel row={{ payment_status: "PAID", due_date: dueDate }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <PurchaseListDueDateLabel
                    row={{ type: "return", payment_status: "UNPAID", due_date: dueDate }}
                />
            )
        ).toBe("");
    });

    it("does not invent a label from invoice_date, created_at, or credit_due_days", () => {
        const markup = renderToStaticMarkup(
            <PurchaseListDueDateLabel
                row={{
                    payment_status: "UNPAID",
                    invoice_date: dueDate,
                    created_at: "2026-09-18T10:00:00.000Z",
                    credit_due_days: 15,
                }}
            />
        );
        expect(markup).toBe("");
    });
});
