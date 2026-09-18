import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryLedgerHistory } from "./InventoryLedgerHistory";

const baseLog = {
    id: 1,
    log_type: "added",
    quantity_change: 2,
    previous_quantity: 1,
    new_quantity: 3,
    reason: "Manual add",
    created_at: "2026-09-18T10:00:00.000Z",
    created_by: "vineet",
};

describe("InventoryLedgerHistory", () => {
    it("shows batch_id on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, batch_id: 42 }]} />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Batch 42/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("Manual add");
    });

    it("omits batch text when batch_id is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(<InventoryLedgerHistory logs={[baseLog]} />);
        expect(omitted).not.toContain("Batch");

        const blank = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, batch_id: "   " }]} />
        );
        expect(blank).not.toContain("Batch");

        const nulled = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, batch_id: null }]} />
        );
        expect(nulled).not.toContain("Batch");
    });

    it("does not invent batch_id from other row fields", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory
                logs={[
                    {
                        ...baseLog,
                        id: 99,
                        batch_number: "LOT-A",
                        batch: { id: 55 },
                    } as typeof baseLog,
                ]}
            />
        );
        expect(markup).not.toContain("Batch");
        expect(markup).not.toContain("LOT-A");
        expect(markup).not.toContain("55");
    });

    it("shows bin_code on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, bin_code: "A-12" }]} />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Bin A-12/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).not.toContain("Batch");
        expect(markup).toContain("Manual add");
    });

    it("omits bin text when bin_code is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(<InventoryLedgerHistory logs={[baseLog]} />);
        expect(omitted).not.toContain("Bin");

        const blank = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, bin_code: "   " }]} />
        );
        expect(blank).not.toContain("Bin");

        const nulled = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, bin_code: null }]} />
        );
        expect(nulled).not.toContain("Bin");
    });

    it("does not invent bin_code from other row fields", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory
                logs={[
                    {
                        ...baseLog,
                        id: 99,
                        bin: "SHELF-9",
                        location: "WH-1",
                    } as typeof baseLog,
                ]}
            />
        );
        expect(markup).not.toContain("Bin");
        expect(markup).not.toContain("SHELF-9");
        expect(markup).not.toContain("WH-1");
    });

    it("shows batch_id and bin_code independently when both are present", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, batch_id: 42, bin_code: "A-12" }]} />
        );
        expect((markup.match(/Batch 42/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect((markup.match(/Bin A-12/g) ?? []).length).toBeGreaterThanOrEqual(2);
    });
});
