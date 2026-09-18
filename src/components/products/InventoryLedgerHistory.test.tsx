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

    it("shows optional inspector_name on table and card surfaces when BE sent it", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory logs={[{ ...baseLog, inspector_name: "Meera" }]} />
        );
        expect((markup.match(/Inspector Meera/g) ?? []).length).toBeGreaterThanOrEqual(2);
    });

    it("omits inspector text when inspector_name is missing, null, or blank", () => {
        expect(renderToStaticMarkup(<InventoryLedgerHistory logs={[baseLog]} />)).not.toContain(
            "Inspector"
        );
        expect(
            renderToStaticMarkup(
                <InventoryLedgerHistory logs={[{ ...baseLog, inspector_name: "   " }]} />
            )
        ).not.toContain("Inspector");
        expect(
            renderToStaticMarkup(
                <InventoryLedgerHistory logs={[{ ...baseLog, inspector_name: null }]} />
            )
        ).not.toContain("Inspector");
    });

    it("does not invent inspector_name from nested inspector, created-by, batch, or reason", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerHistory
                logs={[
                    {
                        ...baseLog,
                        inspector: { name: "Hidden Inspector" },
                        inspector_id: 12,
                        created_by_name: "Ravi Sharma",
                        batch_number: "B-104",
                    } as typeof baseLog,
                ]}
            />
        );
        expect(markup).not.toContain("Inspector");
        expect(markup).not.toContain("Hidden Inspector");
        expect(markup).not.toContain("Ravi Sharma");
        expect(markup).not.toContain("B-104");
    });
});
