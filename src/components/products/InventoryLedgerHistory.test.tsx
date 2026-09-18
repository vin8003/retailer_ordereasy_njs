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
    it("shows warehouse_name on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, warehouse_name: "Main Store" }]} />
        );
        expect(markup).toContain("hidden md:block");
        expect(markup).toContain("block md:hidden");
        expect((markup.match(/Warehouse Main Store/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(markup).toContain("Manual add");
    });

    it("omits warehouse text when warehouse_name is missing, null, or blank", () => {
        const omitted = renderToStaticMarkup(<InventoryLedgerHistory logs={[baseLog]} />);
        expect(omitted).not.toContain("Warehouse");

        const blank = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, warehouse_name: "   " }]} />
        );
        expect(blank).not.toContain("Warehouse");

        const nulled = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, warehouse_name: null }]} />
        );
        expect(nulled).not.toContain("Warehouse");
    });

    it("does not invent warehouse_name from other row fields", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory
                logs={[
                    {
                        ...baseLog,
                        id: 99,
                        warehouse_id: 7,
                        warehouse: { name: "Hidden WH" },
                        location: "Aisle 3",
                        reason: "Stock move",
                    } as typeof baseLog,
                ]}
            />
        );
        expect(markup).not.toContain("Warehouse");
        expect(markup).not.toContain("Hidden WH");
        expect(markup).not.toContain("Aisle 3");
    });
});
