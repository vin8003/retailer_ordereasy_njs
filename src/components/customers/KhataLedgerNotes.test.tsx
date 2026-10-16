import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KhataLedgerNotes } from "./KhataLedgerNotes";

describe("KhataLedgerNotes", () => {
    it("shows muted notes text when BE sent notes", () => {
        const markup = renderToStaticMarkup(
            <KhataLedgerNotes entry={{ notes: "Paid at shop" }} />
        );
        expect(markup).toContain("Paid at shop");
        expect(markup).toContain("Notes Paid at shop");
        expect(markup).toContain("text-muted-foreground");
    });

    it("renders nothing when notes is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<KhataLedgerNotes entry={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(<KhataLedgerNotes entry={{ notes: null }} />)
        ).toBe("");
        expect(
            renderToStaticMarkup(<KhataLedgerNotes entry={{ notes: "  " }} />)
        ).toBe("");
    });

    it("does not invent notes from order, type, payment mode, amount, or description", () => {
        const markup = renderToStaticMarkup(
            <KhataLedgerNotes
                entry={{
                    order_number: "OE-101",
                    transaction_type: "PAYMENT",
                    payment_mode: "UPI",
                    amount: 250,
                    description: "Khata settlement",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
