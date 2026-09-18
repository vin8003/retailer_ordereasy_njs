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

    it("shows rack_location on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, rack_location: "A-12" }]} />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Rack A-12/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("Manual add");
    });

    it("omits rack text when rack_location is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(<InventoryLedgerHistory logs={[baseLog]} />);
        expect(omitted).not.toContain("Rack");

        const blank = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, rack_location: "   " }]} />
        );
        expect(blank).not.toContain("Rack");

        const nulled = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, rack_location: null }]} />
        );
        expect(nulled).not.toContain("Rack");
    });

    it("does not invent rack_location from rack, bin, location, warehouse, reason, or batch", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory
                logs={[
                    {
                        ...baseLog,
                        rack: "A-12",
                        bin: "B1",
                        location: "Front",
                        warehouse_name: "Main",
                        warehouse_id: 3,
                        warehouse: { name: "Main", rack_location: "WH-A" },
                        reason: "Moved to A-12",
                        batch_id: null,
                    } as typeof baseLog,
                ]}
            />
        );
        expect(markup).not.toContain("Rack");
        expect(markup).not.toContain("B1");
        expect(markup).not.toContain("Front");
        expect(markup).not.toContain("Main");
        expect(markup).not.toContain("WH-A");
    });
});
