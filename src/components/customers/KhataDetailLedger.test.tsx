import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KhataDetailLedger } from "./KhataDetailLedger";

const baseEntry = {
    id: 1,
    created_at: "2026-09-18T10:00:00.000Z",
    transaction_type: "PAYMENT",
    notes: "Paid at shop",
    payment_mode: "cash",
    amount: 250,
    balance_after: 1000,
};

describe("KhataDetailLedger", () => {
    it("shows reference_no on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <KhataDetailLedger entries={[{ ...baseEntry, reference_no: "UTR-9911" }]} />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Ref UTR-9911/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("Paid at shop");
    });

    it("omits reference text when reference_no is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(<KhataDetailLedger entries={[baseEntry]} />);
        expect(omitted).not.toContain("Ref ");

        const blank = renderToStaticMarkup(
            <KhataDetailLedger entries={[{ ...baseEntry, reference_no: "   " }]} />
        );
        expect(blank).not.toContain("Ref ");

        const nulled = renderToStaticMarkup(
            <KhataDetailLedger entries={[{ ...baseEntry, reference_no: null }]} />
        );
        expect(nulled).not.toContain("Ref ");
    });

    it("does not invent reference_no from notes, order, or payment fields", () => {
        const markup = renderToStaticMarkup(
            <KhataDetailLedger
                entries={[
                    {
                        ...baseEntry,
                        id: 99,
                        order_number: "OE-101",
                        payment_reference_id: "pay_abc",
                        description: "Khata settlement",
                    },
                ]}
            />
        );
        expect(markup).not.toContain("Ref ");
        expect(markup).not.toContain("pay_abc");
        expect(markup).toContain("OE-101");
    });
});
