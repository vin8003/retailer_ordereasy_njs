import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InventoryLedgerWarehouseLabel } from "./InventoryLedgerWarehouseLabel";

describe("InventoryLedgerWarehouseLabel", () => {
    it("shows muted warehouse text when BE sent warehouse_name", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerWarehouseLabel row={{ warehouse_name: "Main Store" }} />
        );
        expect(markup).toContain("Warehouse Main Store");
        expect(markup).toContain("Main Store");
    });

    it("renders nothing when the field is omitted, null, or blank", () => {
        expect(renderToStaticMarkup(<InventoryLedgerWarehouseLabel row={{}} />)).toBe("");
        expect(
            renderToStaticMarkup(
                <InventoryLedgerWarehouseLabel row={{ warehouse_name: null }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <InventoryLedgerWarehouseLabel row={{ warehouse_name: "" }} />
            )
        ).toBe("");
        expect(
            renderToStaticMarkup(
                <InventoryLedgerWarehouseLabel row={{ warehouse_name: "   " }} />
            )
        ).toBe("");
    });

    it("does not invent a label from warehouse_id, nested warehouse, location, or reason", () => {
        const markup = renderToStaticMarkup(
            <InventoryLedgerWarehouseLabel
                row={{
                    warehouse_id: 7,
                    warehouse: { name: "Hidden WH" },
                    location: "Aisle 3",
                    reason: "Main Store transfer",
                }}
            />
        );
        expect(markup).toBe("");
    });
});
